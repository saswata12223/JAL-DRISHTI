# SOS BLE PACKET AUDIT

## 1. Existing MeshPacket Header

The existing `MeshPacket` in Jal Drishti handles a strict 128-byte packet structure.

Based on the audit of `lib/features/mesh/models/mesh_packet.dart`:
- `[0..3]` Protocol Header "JALD" (4 bytes)
- `[4..19]` Message ID (16 bytes UUID)
- `[20..35]` Sender ID (16 bytes UUID)
- `[36]` TTL (1 byte)
- `[37..44]` Timestamp (8 bytes, ms since epoch)
- `[45]` Packet type (1 byte enum)

**Total Header Size**: 46 bytes.
**Remaining Payload Capacity**: 82 bytes.

## 2. Deriving Metadata for SOS

We do not need to transmit redundant SOS identification fields within the 82-byte payload because:
- **`sos_id`** == The existing 16-byte Message ID.
- **`sender_id`** == The existing 16-byte Sender ID (which also acts as `device_id`).
- **`timestamp`** == The existing 8-byte Timestamp.
- **`hop_count`** == Derived from TTL. The network uses a maximum TTL (e.g. 5). `hop_count = MAX_TTL - TTL`.

## 3. The 82-Byte SOS Payload Format

We will create `SosBlePacket` to efficiently pack the critical SOS data within exactly 82 bytes using fixed-width binary encoding.

| Field | Bytes | Encoding | Required | Description |
|------|------:|----------|----------|-------------|
| Version | 1 | uint8 | Yes | Protocol version (0x01) |
| Distress Type | 1 | uint8 | Yes | Enum (1=FLOOD, 2=LANDSLIDE, 3=TRAPPED, etc.) |
| Latitude | 4 | int32 | Yes | `(lat * 1e5).toInt()` |
| Longitude | 4 | int32 | Yes | `(lng * 1e5).toInt()` |
| People Trapped | 1 | uint8 | Yes | 0 to 255 |
| Battery | 1 | uint8 | Yes | 0 to 100 |
| Message Length | 1 | uint8 | Yes | Defines length of the following string |
| Message | 69 | UTF-8 | Optional | Free-text message, truncated to fit 69 bytes |

**Total:** 1 + 1 + 4 + 4 + 1 + 1 + 1 + 69 = 82 bytes.

## 4. Truncation and Safety

- The `phone` and `name` are explicitly omitted from the BLE broadcast for privacy and size constraints. The backend will associate the sender based on the `sender_id` or they can remain anonymous offline.
- The `message` string is deterministically truncated to fit within the `69` bytes limit.
- Byte lengths are explicitly enforced using `Uint8List` buffers.

## Conclusion
The 82-byte strict payload limitation is met by reusing the existing Mesh metadata and packing location/distress states into binary types.
