
//copying a collection db.<collection_name>.aggregate([ { $out: "<new collection name>" } ])
db.products.aggregate([ { $out: "products_parv" } ])


//using a function in aggregation - here we are replacing a sub-string within a deeply nested array property
db.products_parv1.updateMany(
  { "variants.mediaUrl.url": { $regex: "https://productuat.jaim.tech/" } },

  [
    {
      $set: {
        variants: {
          $function: {
            body: function (variants) {
              for (let i = 0; i < variants.length; i++) {
                let media = variants[i].mediaUrl;
                for (let j = 0; j < media.length; j++) {
                  media[j].url = media[j].url.replace(
                    "https://productuat.jaim.tech/",
                    "https://assets.toothsi.in/products/"
                  );
                }
                variants[i].mediaUrl = media;
              }
              return variants;
            },
            args: ["$variants"],
            lang: "js",
          },
        },
      },
    },
  ]
);

//update deeply nested property for all items - combination of updatemany, map, replaceOne - Same thing we were doing with function
//note - this uses aggregation [] - indicates aggregation. See how we map and mergeObjects to return the data level by level
db.products_parv.updateMany(
  { "variants.mediaUrl.url": { $regex: "https://productuat.jaim.tech/" } },
  [
    {
      $set: {
        variants: {
          $map: {
            input: "$variants",
            in: {
              $mergeObjects: [
                "$$this",
                {
                  mediaUrl: {
                    $map: {
                      input: "$$this.mediaUrl",
                      in: {
                        $mergeObjects: [
                          "$$this",
                          {
                            url: {
                              $replaceOne: {
                                input: "$$this.url",
                                find: "https://productuat.jaim.tech/",
                                replacement:
                                  "https://assets.toothsi.in/products/",
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  ]
);

//similar operation using aggregate where we can use $unwind. $unwind cannot be used in update. Using multiple unwinds
//Note: this wont update records in place - it will update result set
db.products_parv.aggregate([
  {
    $match: {
      "variants.mediaUrl.url": { $regex: "https://productuat.jaim.tech/" },
    },
  },
  {
    $unwind: "$variants",
  },
  {
    $unwind: "$variants.mediaUrl",
  },
  {
    $set: {
      "variants.mediaUrl.url": {
        $replaceOne: {
          input: "$variants.mediaUrl.url",
          find: "https://productuat.jaim.tech/",
          replacement: "https://assets.toothsi.in/products/",
        },
      },
    },
  },
]);

//updating all nested items' single property
db.products.updateOne({"variants._id": ObjectId("61b0888de8efe9bc21736f83")},{$set: {"variants.$[].atcFlow": "REPLACEMENT_ALIGNER"}});

//regex find
//For:
db.users.find({name: /a/})  // Like '%a%'
//Output: patrick, petra
db.users.find({name: /^pa/}) // Like 'pa%'
//Output: patrick
db.users.find({name: /ro$/}) // Like '%ro'