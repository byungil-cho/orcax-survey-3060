const SeedInventory = db.collection("seedinventory");

if (material === "seedPotato") {
  await SeedInventory.updateOne(
    { _id: "singleton" },
    { $inc: { "seedPotato.quantity": 1 } }
  );
} else if (material === "seedBarley") {
  await SeedInventory.updateOne(
    { _id: "singleton" },
    { $inc: { "seedBarley.quantity": 1 } }
  );
}
