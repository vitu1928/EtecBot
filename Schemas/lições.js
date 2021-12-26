module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["buffers"],
      properties: {
        topic: {
          bsonType: "string",
          description: "Topico/assunto que está sendo abordado nesses arquivos"
        },
        buffers: {
          bsonType: "object",
          required: ["buffer", "attachmentName"],
          properties: {
            buffer: {
              bsonType: "array",
              description: "Buffers",
            },
            attachmentName: {
              bsonType: "string",
              description: "Nome dos arquivos"
            }
          }
        },
        materia: {
          bsonType: "string",
          description: "Materia da lição/arquivo"
        }
      }
    }
  }
}