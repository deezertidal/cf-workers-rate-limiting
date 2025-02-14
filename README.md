# Dynamic Rate Limiting
## Overview

**Enhanced Dynamic Rate Limiting on Cloudflare Free Plan Using Cloudflare Workers**  
Automatically block or challenge IPs that exceed a defined request frequency (for specific paths) within a time range (from 1 to 1440 minutes), intended to replace or supplement the default rate-limiting rule in Cloudflare's free plan.


## Setup

1. **Copy** `workers.js` to Cloudflare Workers.
2. **Create an API Token** with the following permissions:
   - `Zone - Zone-WAF - Edit`
   - `Zone - Firewall Services - Edit`
   - `Zone - Analytics - Read`  
   [Create token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
3. **Obtain your Zone ID, Rule ID, and Filter ID** from Cloudflare API:
   - [Find your Zone ID](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/)
   - [Firewall Rules API](https://developers.cloudflare.com/firewall/api/cf-firewall-rules/get/)
   - [Filters API](https://developers.cloudflare.com/firewall/api/cf-filters/get/)
4. **Add API token**, **Zone ID**, **Rule ID**, and **Filter ID** to the Workers variables:
   - `APIKEY`, `FILTER_ID`, `RULE_ID`, `ZONE_ID`
5. **Modify parameters** in the script to tailor the rule to your needs.
6. **Add a cron trigger** in Workers:
   - Go to **Workers settings**
   - Select **Trigger Events**
   - Click **Add Cron Triggers**
<br><br>

Tip:**web-request-monitor.js** offers a web interface for real-time request monitoring.
Demo: [https://cloudflare.rate-limit.workers.dev/](https://cloudflare.rate-limit.workers.dev/)