---
name: realtime-events
description: Redis Pub/Sub messaging, realtime notification infrastructure, and pub/sub testing expectations
---

# Realtime Events Skill

## 1. Architecture
- Built on `RedisService` from `@packages/shared` utilizing `ioredis`.
- Decouples message emission from consumer clients.
- Uses channel naming convention: `<namespace>:<entityId>:<event>` (e.g. `notifications:user_123:new_message`).

## 2. Best Practices
- Keep payload messages small and JSON-serializable.
- Handle connection reconnections automatically through the shared Redis client wrapper.
- Do not store long-term state inside ephemeral pub/sub channels.

## 3. Mandatory Testing Expectations
- Test message serialization and deserialization error handling.
- Verify safe disconnection behavior when the Redis instance closes.
- Ensure pub/sub channel names follow the structured taxonomy.
