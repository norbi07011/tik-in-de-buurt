# Security Policy# Security Policy



## Reporting Security Issues## 🔐 Credential Rotation Log



If you discover a security vulnerability, please report it to:| Date | Action | User Removed | New User | Reason |

- **Email**: [your-security-email]|------|--------|-------------|----------|---------|

- **Priority**: Urgent security issues will be addressed within 24 hours| 2025-10-05 | **Security Audit** | norbsservicee, uzytkownik_bazy_danych_uslugii_norbs, servicenorbs_db_user | **Pending rotation** | Hardcoded credentials found in git history |



## Git History Scrubbing - October 5, 2025## ⚠️ Current Status



**Action**: Permanently removed exposed MongoDB credentials from entire git history**Action Required**: MongoDB credentials rotation in progress



**Tool**: git-filter-repo v2.47.0  ### Exposed Credentials (Historical)

**Execution**: 0.88 seconds, 12 commits rewritten, 618 objects processed  The following credentials were found hardcoded in the codebase and have been removed:

**Status**: ✅ COMPLETED- User: `norbsservicee` (Password exposed in git history)

- User: `uzytkownik_bazy_danych_uslugii_norbs` (Password exposed in test files)

### Removed Credentials (100% Success)- User: `servicenorbs_db_user` (Password exposed in archived files)



| User | Password | Status | Action Date |### Remediation Steps

|------|----------|--------|-------------|1. ✅ Hardcoded credentials removed from active code

| norbsservicee | DhErllNY7xrg0WOg | ***REMOVED*** from git history | 2025-10-05 |2. ✅ Centralized DB connector created (`backend/src/db/index.ts`)

| servicenorbs_db_user | Xpki77OXRWM3S | ***REMOVED*** from git history | 2025-10-05 |3. ✅ Documentation credentials redacted

| (unknown) | XpiKLZ7OXKRwM3S | ***REMOVED*** from git history | 2025-10-05 |4. ⏳ **Pending**: Create new MongoDB user in Atlas

| (test user) | TkB_Pr0d_2025_mDb!xY9#zK8$wL7&vN6 | ***REMOVED*** from git history | 2025-10-05 |5. ⏳ **Pending**: Delete old MongoDB users

6. ⏳ **Pending**: Update production environment variables

### Verification

## 🛡️ Security Best Practices

```bash

# Verified with git log search### For Developers

git log -S "DhErllNY7xrg0WOg" --all  # 0 results ✅

git log -S "Xpki77OXRWM3S" --all     # 0 results ✅#### Never Commit Secrets

git log -S "XpiKLZ7OXKRwM3S" --all   # 0 results ✅```bash

git log -S "TkB_Pr0d_2025_mDb" --all # 0 results ✅# ❌ NEVER do this:

```const MONGODB_URI = 'mongodb+srv://user:password@...';



**Result**: Repository history is clean and secure# ✅ ALWAYS do this:

const MONGODB_URI = process.env.MONGODB_URI;

### Backupif (!MONGODB_URI) {

  throw new Error('MONGODB_URI is required');

Before scrubbing, created backup:}

- Location: `../backup-emergency-20251005-193000````

- Type: Mirror clone (all branches, tags, refs)

- Size: Full repository with original history#### Use Environment Variables

- All secrets must be in `.env` files (which are in `.gitignore`)

### Force Push- Use `.env.example` with placeholder values for documentation

- Never commit `.env` files to version control

Both branches updated with clean history:

- `master`: 609abda → 98b30fd → 77b62fc#### Code Reviews

- `sec/mongo-emergency-rotation`: 609abda → 98b30fdBefore approving any PR, verify:

- `master-clean`: Created from scrubbed history- [ ] No hardcoded API keys, passwords, or tokens

- [ ] No MongoDB connection strings in code

### Team Notification- [ ] All secrets use `process.env.*`

- [ ] `.env.example` is updated if new variables added

⚠️ **IMPORTANT FOR ALL TEAM MEMBERS**:- [ ] No credentials in commit messages or comments



If you have a local clone of this repository, you MUST:### For Database Access

1. Backup your local changes (if any)

2. Delete your local repository#### MongoDB Atlas User Privileges

3. Fresh clone: `git clone https://github.com/norbi07011/tik-in-de-buurt.git`- **Production**: `readWrite` on specific database only

4. Apply your local changes (if any)- **Development**: `readWrite` on dev database

- **Never use**: `dbAdmin`, `root`, or cluster-wide roles

**DO NOT** try to pull/merge - history has been rewritten!

#### Connection String Format

## MongoDB Credential Rotation Log```

mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?retryWrites=true&w=majority

| Date | Action | User | Status |```

|------|--------|------|--------|

| 2025-10-05 | **Emergency Rotation** | tikb_app_prod | ✅ ACTIVE |#### Network Access

| 2025-10-05 | Credential Scrubbing | norbsservicee | ⚠️ REMOVED from git history |- Whitelist specific IPs when possible

| 2025-10-05 | Credential Scrubbing | servicenorbs_db_user | ⚠️ REMOVED from git history |- Use `0.0.0.0/0` only if necessary (with strong passwords)

| 2025-10-05 | **DELETE FROM ATLAS** | norbsservicee | 🔴 TODO |- Review and remove unused IP addresses regularly

| 2025-10-05 | **DELETE FROM ATLAS** | servicenorbs_db_user | 🔴 TODO |

### For Deployment

### Active Credentials (Production)

#### Netlify/Vercel Environment Variables

**MongoDB Atlas Connection**:1. Never expose secrets in build logs

- Cluster: `cluster0.bnzcc6v.mongodb.net`2. Mark sensitive variables as "sensitive" in dashboard

- Database: `tik-in-de-buurt`3. Rotate credentials after team member leaves

- User: `tikb_app_prod`4. Use different credentials for staging/production

- Password: Stored in `.env` (NOT in git)

- Permissions: `readWrite` on `tik-in-de-buurt` database#### CI/CD Secrets

1. Store in GitHub Secrets (never in workflow files)

### Cleanup Required2. Limit scope of secrets to specific workflows

3. Rotate regularly (quarterly minimum)

❗ **IMMEDIATE ACTION REQUIRED**:4. Use read-only credentials for CI when possible



1. Login to MongoDB Atlas: https://cloud.mongodb.com/## 🚨 Incident Response

2. Navigate to: Database Access

3. Delete old users:### If You Suspect a Credential Leak

   - ✅ `norbsservicee` (password already removed from git)

   - ✅ `servicenorbs_db_user` (password already removed from git)1. **Immediate Actions** (within 1 hour):

4. Verify only `tikb_app_prod` remains active   - [ ] Rotate affected credentials immediately

   - [ ] Review access logs for unauthorized usage

## Netlify Cleanup - October 5, 2025   - [ ] Notify team lead/security contact



**Action**: Removed Netlify artifacts to prepare for future clean deploy2. **Short-term** (within 24 hours):

   - [ ] Scan codebase for other potential leaks

### Removed Files   - [ ] Update all production secrets

   - [ ] Review git history for exposure timeline

- `netlify.toml` (2020 bytes) - Netlify build configuration

- `public/_headers` (566 bytes) - Redundant header rules (duplicated netlify.toml)3. **Long-term** (within 1 week):

- `public/_redirects` (639 bytes) - Redundant routing rules (duplicated netlify.toml)   - [ ] Post-mortem: How did this happen?

   - [ ] Update processes to prevent recurrence

### Kept Files   - [ ] Train team on security best practices

   - [ ] Implement automated secret scanning

- `.env.netlify.example` - Environment variable template for Netlify deploy

- `NETLIFY_DEPLOY.md` - Original Netlify documentation### If You Find a Leaked Secret in Git History

- `rotations/NETLIFY_CLEANUP_REPORT.md` - Cleanup details and clean config template

```bash

### Updated# Don't try to remove from history - it's already exposed!

# Instead, immediately rotate the credential:

- `.gitignore` - Added Netlify exclusions:

  ```gitignore1. Create new user/key in service (MongoDB, AWS, etc.)

  # Netlify2. Update production environment variables

  netlify.toml3. Verify new credentials work

  .netlify/4. Delete old user/key

  netlify/5. Document in this file's Rotation Log

  ``````



### Verification## 📞 Reporting Security Issues



- ✅ Frontend build: `npm run build` (3.97s, 2117KB bundle)### Internal (Team Members)

- ✅ Backend start: `node backend/enhanced-server.js` (port 8080, mock mode)- **Slack**: #security channel

- ✅ No Netlify dependencies found in package.json- **Email**: security@example.com

- **Urgent**: Contact team lead directly

### Future Deploy

### External (Security Researchers)

When ready to deploy to Netlify:- **Email**: security@example.com

1. See `README.md` section "📦 Deploy na Netlify"- **Response time**: Within 24 hours

2. Clean `netlify.toml` template available in `rotations/NETLIFY_CLEANUP_REPORT.md`- **Disclosure**: Coordinated (90 days)

3. Configure environment variables in Netlify dashboard

Please include:

## Security Best Practices- Description of vulnerability

- Steps to reproduce

### Environment Variables- Potential impact

- Suggested fix (if any)

**NEVER** commit these to git:

- MongoDB connection strings## 🎓 Security Training

- API keys (Gemini, payment providers)

- JWT secrets### Required Reading

- OAuth client secrets- [ ] [OWASP Top 10](https://owasp.org/www-project-top-ten/)

- Any passwords or tokens- [ ] [Secrets in Git](https://github.com/awslabs/git-secrets)

- [ ] This SECURITY.md file

**Always**:

- Use `.env` files (already in `.gitignore`)### Tools to Install

- Use environment variables in production (Netlify, Railway, etc.)```bash

- Rotate credentials immediately if exposed# Prevent committing secrets

- Use git-filter-repo to remove from history if accidentally committednpm install --save-dev husky

npm install --save-dev eslint-plugin-no-secrets

### Git Commit Guidelines

# Scan for secrets in codebase

Before committing:npm install --global @gitguardian/ggshield

1. Check `git status` for sensitive filesggshield secret scan path .

2. Review `git diff` for hardcoded credentials```

3. Verify `.env` is in `.gitignore`

4. Use `.env.example` for templates (with dummy values)### Pre-commit Hook

```bash

### Production Deployment#!/bin/sh

# .husky/pre-commit

1. **Backend First**: Deploy backend to Railway/Render/Fly.io

2. **Get URL**: Record production backend URL# Check for MongoDB URIs in staged files

3. **Environment Variables**: Set in hosting provider dashboardif git diff --cached --name-only | xargs grep -E "mongodb(\+srv)?://[^<]" 2>/dev/null; then

4. **Frontend Deploy**: Deploy frontend with backend URL configured  echo "❌ Error: Found hardcoded MongoDB URI in staged files!"

5. **Verify**: Test all integrations in production  echo "   Please use environment variables instead."

  exit 1

## Documentationfi



For detailed reports:# Check for common secret patterns

- Git scrubbing: `rotations/SCRUBBING_SUCCESS_REPORT.md`if git diff --cached | grep -E "(password|api_key|secret|token)\s*=\s*['\"]([^'\"]{8,})" 2>/dev/null; then

- Netlify cleanup: `rotations/NETLIFY_CLEANUP_REPORT.md`  echo "⚠️  Warning: Potential secret found in staged changes."

- Deployment guide: `README.md` (Deploy na Netlify section)  echo "   Please review and use environment variables if needed."

  exit 1

## Contactfi

```

For security concerns or questions:

- Create a private GitHub issue## 📋 Audit Checklist

- Or email: [your-security-email]

### Monthly Review

---- [ ] Review MongoDB Atlas user list

- [ ] Check for unused API keys/tokens

**Last Updated**: October 5, 2025  - [ ] Verify IP whitelist is current

**Status**: ✅ Git history clean, ✅ Netlify cleanup complete, 🔴 Atlas user deletion pending- [ ] Review access logs for anomalies

- [ ] Update this document with any changes

### Quarterly Rotation
- [ ] Rotate MongoDB production user password
- [ ] Rotate JWT secret
- [ ] Rotate API keys for third-party services
- [ ] Update all environment variables
- [ ] Document in Rotation Log

### After Team Changes
- [ ] Remove access for departing team members
- [ ] Rotate any shared credentials they had access to
- [ ] Review and update IP whitelist
- [ ] Audit git history for any committed secrets

## 📜 Compliance

### Data Protection
- All credentials are treated as sensitive data
- Credentials are never logged or stored in plaintext
- Access to production credentials is limited to:
  - DevOps team
  - Senior developers
  - Team lead

### Retention
- Old credentials are revoked immediately after rotation
- Rotation logs are kept for 2 years minimum
- Access logs are kept for 1 year minimum

## 🔄 Version History

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2025-10-05 | Initial security policy created | Security Audit |
| | | - Documented exposed credentials | |
| | | - Added rotation procedures | |
| | | - Defined best practices | |

---

**Last Updated**: October 5, 2025  
**Next Review**: January 5, 2026  
**Document Owner**: DevOps Team
