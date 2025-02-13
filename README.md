# Dynamic Rate Limiting
## Overview

Enhanced Dynamic Rate Limiting Rule on Cloudflare Free Plan Using Cloudflare Workers.

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
