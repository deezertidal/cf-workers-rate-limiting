async function fetchGraphQL(query, variables = {}) { 
  const apiUrl = 'https://api.cloudflare.com/client/v4/graphql';
  const headers = {
    'Authorization': `Bearer ${APIKEY}`, 
    'Content-Type': 'application/json',
  };
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ query, variables }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to fetch data from Cloudflare API');
  }
}
//OR: [{ clientRequestPath_like: "/path1/%"},{ clientRequestPath_like: "/path2/%"}] represents the paths to monitor. If you want to monitor the entire site, remove this section.
async function fetchBlockedIpsAndRequests(zoneTag, startTime, endTime) {
  const query = `
    {
      viewer {
        zones(filter: { zoneTag: "${zoneTag}" }) {
          firewallEventsAdaptive(
            filter: {
              datetime_geq: "${startTime}"
              datetime_leq: "${endTime}"
              action: "block"
            }
            limit: 10000
            orderBy: [datetime_DESC]
          ) {
            clientIP
          }
          httpRequestsAdaptive(
            filter: {
              datetime_geq: "${startTime}"
              datetime_leq: "${endTime}"
              OR: [{ clientRequestPath_like: "/path1/%"},{ clientRequestPath_like: "/path2/%"}] 

            }
            limit: 10000
            orderBy: [datetime_DESC]
          ) {
            clientIP
            clientRequestPath
          }
        }
      }
    }`;

  const data = await fetchGraphQL(query);
  return {
    BlockedIps: data.data?.viewer?.zones[0]?.firewallEventsAdaptive?.map(event => event.clientIP) || [],
    requests: data.data?.viewer?.zones[0]?.httpRequestsAdaptive || [],
  };
}
//req.clientRequestPath.includes('/path1') || req.clientRequestPath === '/path2.ext' represents paths that should not be monitored (those that include /path1 or are equal to /path2.ext).
async function processRequests(requests, BlockedIps) {
  const ipPathCounts = {};
  requests.forEach(req => {
    if (req.clientRequestPath.includes('/path1') || req.clientRequestPath === '/path2.ext') {
      return;
    }
    if (!ipPathCounts[req.clientIP]) {
      ipPathCounts[req.clientIP] = [];
    }
    const existingPath = ipPathCounts[req.clientIP].find(path => path.path === req.clientRequestPath);
    if (existingPath) {
      existingPath.count++;
    } else {
      ipPathCounts[req.clientIP].push({ path: req.clientRequestPath, count: 1 });
    }
  });

  const exceededRequests = Object.entries(ipPathCounts)
    .map(([ip, paths]) => {
      const sortedPaths = paths.sort((a, b) => b.count - a.count);
      const TopPaths = sortedPaths.slice(0, 3); // Only consider the top three most requested paths.
      const Total  = TopPaths.reduce((sum, path) => sum + path.count, 0);
      return {
        IP: ip,
        Total,
        TopPaths
      };
    })
    .filter(req => req.Total > 50);  // Filter out IPs with the total request count of the top 3 paths greater than 50.
  const Blocked = exceededRequests.filter(req => BlockedIps.includes(req.IP));
  const UnBlocked = exceededRequests.filter(req => !BlockedIps.includes(req.IP));
  return { UnBlocked, Blocked };
}
// You can modify expression to include your own custom filters, such as (ip.src in {${uniqueIps.join(' ')}} and http.request.uri.path wildcard r"/path3/*" and http.user_agent contains "curl")
async function updateFilterExpression(zoneId, filterId, blockedIps, unblockedIps) {
  const allIps = [...blockedIps, ...unblockedIps]; 
  const uniqueIps = [...new Set(allIps)]; 
  const expression = `(ip.src in {${uniqueIps.join(' ')}})`;
  const filterUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/filters/${filterId}`;
  const data = {
    "id": filterId,
    "expression": expression 
  };
  const headers = {
    'Authorization': `Bearer ${APIKEY}`, 
    'Content-Type': 'application/json',
  };
  const response = await fetch(filterUrl, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(`Failed to update filter: ${result.errors[0].message}`);
  }
}

async function updateFirewallRule(zoneId, ruleId, filterId) {
  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/rules/${ruleId}`;
  
  const data = {
    "id": ruleId,
    "description": "rate-limit", // Rule description
    "filter": {
      "id": filterId 
    },
    "action": "block",  // Action to take: block, challenge, managed challenge, etc.
    "priority": 1 // Rule priority
  };
  const headers = {
    'Authorization': `Bearer ${APIKEY}`, 
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(`Failed to update rule: ${result.errors[0].message}`);
  }
}
async function handleRequest(event) {
  const now = new Date();
  const startTime = new Date(now - 100 * 60 * 1000).toISOString(); // Time range: last 100 minutes
  const endTime = now.toISOString();
  const zoneTag = ZONE_ID;
  const ruleId = RULE_ID;
  const filterId = FILTER_ID;

  try {
    const { BlockedIps, requests } = await fetchBlockedIpsAndRequests(zoneTag, startTime, endTime);
    if (!requests.length) {
      const filterResult = await updateFilterExpression(zoneTag, filterId, [], []);
      const ruleResult = await updateFirewallRule(zoneTag, ruleId, filterId);

      return new Response('No requests found within the given time range. Filter and rule updated to clear IPs.', {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { UnBlocked, Blocked } = await processRequests(requests, BlockedIps);
    const blockedIps = Blocked.map(req => req.IP);
    const unblockedIps = UnBlocked.map(req => req.IP);
    const filterResult = await updateFilterExpression(zoneTag, filterId, blockedIps, unblockedIps);
    const ruleResult = await updateFirewallRule(zoneTag, ruleId, filterId);
    const formattedResponse = JSON.stringify({ UnBlocked, Blocked, filterUpdate: filterResult, ruleUpdate: ruleResult }, null, 2);
    return new Response(formattedResponse, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Error processing data: ' + error.message, { status: 500 });
  }
}


addEventListener('scheduled', event => {
  event.waitUntil(handleRequest(event));
}); 
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});