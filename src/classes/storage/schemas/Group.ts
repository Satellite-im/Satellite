export default {
  name: "GroupMessages",
  schema: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "GroupMessages",
    "description": "Mapping storing group messages",
    "type": "object",
    "properties": {
      "_id": {
        "description": "Field to contain ulid-based instance id",
        "type": "string",
      },
      "group": {
        "description": "Group ID",
        "type": "string",
      },
      "message": {
        "description": "Encrypted message payload",
        "type": "string",
      },
      "timestamp": {
        "description": "Timestamp of the message"
      }
    },
    "required": ["_id", "group", "message", "timestamp"],
  }
};