const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloudflare Request Monitor</title>
  <style>
  body {
    background-color:#f9fafb;
    margin:0;
    padding:0;
    font-family:'Inter',Arial,sans-serif;
    color:#333333;
    line-height:1.6;
  }
  h1 {
    text-align:center;
    font-size:2rem;
    font-weight:600;
    color:#333333;
    margin-top:50px;
    letter-spacing:0.5px;
  }
  .form-container,.result-container {
    width:90%;
    max-width:960px;
    margin:40px auto;
    padding:40px;
    background-color:#ffffff;
    border-radius:12px;
    box-shadow:0 10px 30px rgba(0,0,0,0.1);
    box-sizing:border-box;
    transition:transform 0.3s ease,box-shadow 0.3s ease;
  }
  .form-container:hover,.result-container:hover {
    box-shadow:0 15px 40px rgba(0,0,0,0.2);
  }
  .form-container label {
    display:block;
    margin-bottom:12px;
    font-size:16px;
    font-weight:600;
    color:#333333;
    text-transform:uppercase;
    letter-spacing:1px;
    opacity:0.8;
  }
  .form-container input,.form-container textarea,.form-container select {
    width:100%;
    padding:14px 18px;
    margin-bottom:20px;
    border:1px solid #ddd;
    border-radius:10px;
    font-size:16px;
    background-color:#f9fafb;
    color:#333333;
    transition:border-color 0.3s ease,background-color 0.3s ease;
    box-sizing:border-box;
  }
  .form-container input:focus,.form-container textarea:focus,.form-container select:focus {
    border-color:#F38020;
    background-color:#fff;
    outline:none;
  }
  .form-container button {
    width:100%;
    padding:18px;
    background-color:#F38020;
    color:white;
    border:none;
    border-radius:10px;
    font-size:18px;
    font-weight:600;
    cursor:pointer;
    transition:background-color 0.3s ease,transform 0.2s ease;
    box-sizing:border-box;
  }
  .form-container button:hover {
    background-color:#FFCC00;
  }
  .result-container p {
    font-size:1.2rem;
    font-weight:600;
    color:#333333;
    margin-bottom:20px;
    text-align:center;
  }
  pre {
    background-color:#f4f4f4;
    padding:20px;
    border-radius:10px;
    color:#333333;
    font-family:'Courier New',monospace;
    font-size:14px;
    white-space:pre-wrap;
    word-wrap:break-word;
    box-sizing:border-box;
  }
  input[type="number"] {
    -moz-appearance:textfield;
  }
  input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance:none;
    margin:0;
  }
  @media (max-width:768px) {
    h1 {
    font-size:2rem;
  }
  .form-container,.result-container {
    width:95%;
    padding:25px;
  }
  .form-container label {
    font-size:14px;
  }
  .form-container input,.form-container textarea,.form-container select {
    padding:12px 14px;
  }
  .form-container button {
    font-size:16px;
  }
  }
</style>

</head>
<body>
  <h1>Cloudflare Request Monitor</h1>
  <div class="form-container">
  <form id="monitorForm" action="/" method="POST">
  <div>
    <label for="zoneId">Zone ID</label>
    <input type="text" id="zoneId" name="zoneId" placeholder="Enter Zone ID" required />
  </div>
  <div>
    <label for="apiToken">API Token</label>
    <input type="text" id="apiToken" name="apiToken" placeholder="Enter API Token" required />
  </div>
  <div>
    <label for="monitorPaths">Paths to Monitor</label>
    <textarea id="monitorPaths" name="monitorPaths" placeholder="e.g., /path1/,/path2/, comma separated, leave empty for all"></textarea>
  </div>
  <div>
    <label for="excludePaths">Paths to Exclude</label>
    <textarea id="excludePaths" name="excludePaths" placeholder="e.g., /path1/, /path2/, comma separated, leave empty for none"></textarea>
  </div>
  <div>
  <label for="maxTopPathsPerIP">Max Top Paths</label>
  <input type="number" name="maxTopPathsPerIP" placeholder="Max Top Paths per IP" min="1" max="10" value="3" required />
  </div>
  <div>
    <label for="timeRange">Time Range (minutes)</label>
    <input type="number" id="timeRange" name="timeRange" placeholder="1 to 1440 minutes" min="1" max="1440" required />
  </div>
  <div>
    <label for="requestCount">Request Count Threshold</label>
    <input type="number" id="requestCount" name="requestCount" placeholder="Request Count Threshold" required />
  </div>
  <div>
    <button type="submit">Submit</button>
  </div>
</form>
  </div>
  <div class="result-container" id="result"><p><strong>Result:</strong></p></div>
  <script>
  document.getElementById('monitorForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const params = Object.fromEntries(formData);

    localStorage.setItem('monitorFormData', JSON.stringify(params));

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p>Loading...</p>';

    const response = await fetch(event.target.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    } else {
      const errorText = await response.text();
      resultDiv.innerHTML = '<p>Error: ' + errorText + '</p>';
    }
  });

  window.onload = () => {
    const savedData = localStorage.getItem('monitorFormData');
    if (savedData) {
      const params = JSON.parse(savedData);
      for (const key in params) {
        const input = document.querySelector('[name="' + key + '"]');
        if (input) {
          input.value = params[key];
        }
      }
    }
  };
</script>

</body>
</html>
`;

async function fetchGraphQL(query, variables = {}, apiToken) { 
  const apiUrl = 'https://api.cloudflare.com/client/v4/graphql';
  const headers = {
    'Authorization': `Bearer ${apiToken}`,
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
    const error = await response.json();
    throw new Error(error?.errors?.[0]?.message || 'Failed to fetch data from Cloudflare API');
  }
}

async function fetchBlockedIpsAndRequests(zoneTag, startTime, endTime, apiToken, monitorPaths, excludePaths) {
  const pathsToMonitor = monitorPaths.length > 0 ? monitorPaths.map(path => `{ clientRequestPath_like: "${path}%" }`) : [];
  const excludePathsFilter = excludePaths.length > 0 ? excludePaths.map(path => `req.clientRequestPath.includes('${path}')`) : [];

  let query = `
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
              ${pathsToMonitor.length > 0 ? `OR: [${pathsToMonitor.join(',')}]` : ''}
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

  const data = await fetchGraphQL(query, {}, apiToken);
  return {
    BlockedIps: data.data?.viewer?.zones[0]?.firewallEventsAdaptive?.map(event => event.clientIP) || [],
    requests: data.data?.viewer?.zones[0]?.httpRequestsAdaptive || [],
  };
}

async function processRequests(requests, BlockedIps, excludePaths, requestCountThreshold, maxPaths) {
  const ipPathCounts = {};
  requests.forEach(req => {
    if (excludePaths.some(path => req.clientRequestPath.includes(path))) {
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
      const TopPaths = sortedPaths.slice(0, maxPaths);
      const Total = TopPaths.reduce((sum, path) => sum + path.count, 0);
      return {
        IP: ip,
        Total,
        TopPaths
      };
    })
    .filter(req => req.Total >= requestCountThreshold);

  const Blocked = exceededRequests.filter(req => BlockedIps.includes(req.IP));
  const UnBlocked = exceededRequests.filter(req => !BlockedIps.includes(req.IP));
  return { UnBlocked, Blocked };
}

async function handleRequest(event) {
  const requestData = await event.request.json();
  const now = new Date();
  const minutes = parseInt(requestData.timeRange) || 1440;
  const startTime = new Date(now - minutes * 60 * 1000).toISOString();  
  const endTime = now.toISOString();
  const zoneTag = requestData.zoneId;
  const apiToken = requestData.apiToken;
  const monitorPaths = requestData.monitorPaths ? requestData.monitorPaths.split(',').map(path => path.trim()) : [];
  const excludePaths = requestData.excludePaths ? requestData.excludePaths.split(',').map(path => path.trim()) : [];
  const requestCountThreshold = parseInt(requestData.requestCount);
  const maxPaths = parseInt(requestData.maxTopPathsPerIP) || 3;

  try {
    const { BlockedIps, requests } = await fetchBlockedIpsAndRequests(zoneTag, startTime, endTime, apiToken, monitorPaths, excludePaths);
    if (!requests.length) {
      return new Response('No requests found within the given time range. Please check your time range or request parameters.', {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { UnBlocked, Blocked } = await processRequests(requests, BlockedIps, excludePaths, requestCountThreshold, maxPaths);
    const formattedResponse = JSON.stringify({ UnBlocked, Blocked }, null, 2);
    return new Response(formattedResponse, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}

async function handleGetRequest(event) {
  return new Response(htmlPage, {
    headers: { 'Content-Type': 'text/html' },
  });
}

addEventListener('fetch', event => {
  if (event.request.method === 'POST') {
    event.respondWith(handleRequest(event));
  } else {
    event.respondWith(handleGetRequest(event));
  }
});
