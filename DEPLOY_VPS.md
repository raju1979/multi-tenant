# VPS Backend Deployment Guide

The Multi-Tenant SaaS backend is deployed and running on your VPS alongside the existing applications.

---

### VPS Details & Ports

| Application | Service Name | Internal Port | Public Routing | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ApnaDesign** | `apnadesign.service` | `3000` | `https://apnadesign.ajarafashion.com` | 🟢 Active |
| **Reactor Arena** | `unreal-arena.service` | `3001` | `https://unreal-api.ajarafashion.com` | 🟢 Active |
| **Multi-Tenant SaaS** | `multitenant-backend.service` | `5001` | `http://65.75.203.202:5001` | 🟢 Active |

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
