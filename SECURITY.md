# Security Policy

## Supported Versions

We take security seriously. Currently, only the latest major version of Portal is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Architecture & Privacy

Portal is designed with a **Zero-Persistence Data Model**:
- All uploaded files are buffered entirely in volatile memory (RAM).
- No file data is ever written to disk or long-term storage.
- Rooms and their contents are automatically purged after 24 hours of inactivity.
- Connecting to a room requires the exact randomly-generated room code.

## Reporting a Vulnerability

If you discover a security vulnerability within Portal, please **DO NOT** open a public issue. 

Instead, please send an email to the project maintainer or reach out privately. We will review all security reports and aim to provide a response and a patch as quickly as possible.

**Please include the following details in your report:**
- Description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.

Thank you for helping keep Portal secure! 🛡️
