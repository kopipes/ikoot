# QR Code Generation Guide for IKOOT Event Check-in

## Required QR Format

Your QR codes must contain **exactly** this text format:

```
IKOOT_EVENT:1
IKOOT_EVENT:2  
IKOOT_EVENT:3
IKOOT_EVENT:4
IKOOT_EVENT:5
```

## Critical Requirements

1. **Exact Format**: Must start with `IKOOT_EVENT:` (all uppercase)
2. **No Extra Spaces**: No spaces before or after the text
3. **No Extra Characters**: No quotes, brackets, or other characters
4. **Plain Text**: Just the raw text, no formatting
5. **Valid Event IDs**: Use only numbers 1, 2, 3, 4, or 5

## ❌ Wrong Examples

- `ikoot_event:1` (lowercase)
- `IKOOT_EVENT: 1` (space after colon)  
- `"IKOOT_EVENT:1"` (quotes)
- `IKOOT_EVENT:1 ` (trailing space)
- `IKOOT_EVENT:6` (invalid event ID)

## ✅ Correct Examples

- `IKOOT_EVENT:1`
- `IKOOT_EVENT:2`
- `IKOOT_EVENT:3`
- `IKOOT_EVENT:4`
- `IKOOT_EVENT:5`

## Testing Steps

1. Generate QR code with exactly `IKOOT_EVENT:1`
2. Open IKOOT app QR scanner
3. Scan the generated QR code
4. Check diagnostic panel for detection logs
5. Should show "Check-in successful!" with +5 points

## Recommended QR Generators

- https://qr-code-generator.com 
- https://www.qr-code-generator.org
- https://qrcode.tec-it.com

**Important**: Make sure to paste the exact text `IKOOT_EVENT:1` without any modifications.