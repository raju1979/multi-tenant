# VPS Backend Deployment Guide

The Multi-Tenant SaaS backend is deployed and running on your VPS alongside the existing applications.

---

### VPS Details & Ports

| Application | Service Name | Internal Port | Public Routing | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ApnaDesign** | `apnadesign.service` | `3000` | `https://apnadesign.ajarafashion.com` | 🟢 Active |
| **Reactor Arena** | `unreal-arena.service` | `3001` | `https://unreal-api.ajarafashion.com` | 🟢 Active |
| **Multi-Tenant SaaS** | `multitenant-backend.service` | `5001` | `https://65.75.203.202/api` (Caddy HTTPS Reverse Proxy) | 🟢 Active |

---

### Hostinger Remote MySQL Configuration Note
When connecting from the VPS to Hostinger shared MySQL (`srv1674.hstgr.io`), Hostinger's Remote MySQL whitelist only whitelists the specific IPv4 address (`65.75.203.202`). If using domain hostname `srv1674.hstgr.io`, Linux may route traffic over IPv6 (`2606:cc0:400:320::1`) which results in:
`Access denied for user '...'@'2606:cc0:400:320::1'`

**Solution**: Set `DB_HOST=193.203.184.160` (the direct IPv4 address of `srv1674.hstgr.io`) in `/opt/multi-tenant-backend/.env` to ensure all queries egress via the whitelisted IPv4 address.

---

### Useful VPS Management Commands

Since your SSH key is installed and configured (`ssh vps`), you can run these commands from your Mac:

```bash
# Check service status
ssh vps "systemctl status multitenant-backend.service"

# View real-time logs
ssh vps "journalctl -u multitenant-backend.service -f"

# Restart the service
ssh vps "systemctl restart multitenant-backend.service"

# Stop the service
ssh vps "systemctl stop multitenant-backend.service"

# Health check
curl http://65.75.203.202:5001/api/health
```

---

### File Location on VPS
- **Directory**: `/opt/multi-tenant-backend`
- **Configuration**: `/opt/multi-tenant-backend/.env`
- **Systemd Unit**: `/etc/systemd/system/multitenant-backend.service`
- **Firewall (UFW)**: Port `5001/tcp` opened
