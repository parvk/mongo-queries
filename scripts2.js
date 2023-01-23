//update deep inside as per match found
db.products.updateOne(
  { "variants._id": ObjectId("636266ae2851aa002068a393") },
  { $set: { "variants.$.eanCode": "9029645143" } },
)