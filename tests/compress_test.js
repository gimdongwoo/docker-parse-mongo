// GIST: https://gist.github.com/comerford/e5417b57d8b4691dc55c
// these docs, in 2.6, get bucketed into the 256 bucket (size without header = 240)
// From Object.bsonsize(db.data.findOne()), the size is actually 198 for reference, so add 16 to that for an exact fit
// with that doc size, 80,000 is a nice round number under the 16MiB limit, so will use that for the inner loop
 
// We are shooting for ~16 GiB of data, without indexes, so do 1,024 iterations (512 from each client)
// This will mean being a little short (~500MiB) in terms of target data size, but keeps things simple
 
for(var j = 0; j < 10; j++){ //
  bigDoc = [];
  for(var i = 0; i < 80000; i++){
  // we get an ObjectID in _id for "free", and it's a common default, so let's leave it as-is
  // next, let's get one random number per iteration, use it to generate a bunch of consistently sized data
    var randomNum = Math.random();
    // date is easy, just multiply by a decent number
    var dateField = new Date(1500000000000 * randomNum);
    var intField = Math.floor(randomNum * 1000000);
    var stringField = randomNum.toString(36).substring(2, 15);
    var boolField = intField % 2;
    bigDoc.push({ranDate : dateField, ranInt : Math.floor(randomNum * 1000000), ranString : stringField, ranBool : boolField, simpleArray : [{subdoc1: randomNum}, {subdoc2 : dateField}, {subdoc3 : new ObjectId()}]});
    };
  db.data.insert(bigDoc);
}; 