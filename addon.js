const { addonBuilder } = require("stremio-addon-sdk");
const magnet = require("magnet-uri");

const manifest = { 
    "id": "org.top250imdb.isparoz",
    "version": "1.0.0",

    "name": "TOP 250 IMDB",
    "description": "Collection of movies from IMDB TOP 250",
    "icon": "https://github.com/isparoz/top250imdb-sa/blob/master/bitmap3.png?raw=true",
 


    // set what type of resources we will return
    "resources": [
        "catalog",
        "stream"
    ],

    "types": ["movie"], // your add-on will be preferred for those content types

    // set catalogs, we'll be making 2 catalogs in this case, 1 for movies and 1 for series
    "catalogs": [
        {
            type: 'movie',
            id: 'top250imdbmovies'
        }
    ],

    // prefix of item IDs (ie: "tt0032138")
    "idPrefixes": [ "tt" ]

};



const dt = require('./filmdata');



dataset = dt


// utility function to add from magnet
function fromMagnet(name, type, uri) {
    const parsed = magnet.decode(uri);
    const infoHash = parsed.infoHash.toLowerCase();
    const tags = [];
//    if (uri.match(/720p/i)) tags.push("720p");
//    if (uri.match(/1080p/i)) tags.push("1080p");
    return {
        name: name,
        type: type,
        infoHash: infoHash,
        sources: (parsed.announce || []).map(function(x) { return "tracker:"+x }).concat(["dht:"+infoHash]),
        tag: tags,
        title: tags[0], // show quality in the UI
    }
}

const builder = new addonBuilder(manifest);

// Streams handler
builder.defineStreamHandler(function(args) {
    if (dataset[args.id]) {
        return Promise.resolve({ streams: [dataset[args.id]] });
    } else {
        return Promise.resolve({ streams: [] });
    }
})

const METAHUB_URL = "https://images.metahub.space"

const generateMetaPreview = function(value, key) {
    // To provide basic meta for our movies for the catalog
    // we'll fetch the poster from Stremio's MetaHub
    // see https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/meta.md#meta-preview-object
    const imdbId = key.split(":")[0]
    return {
        id: imdbId,
        type: value.type,
        name: value.name,
        poster: METAHUB_URL+"/poster/medium/"+imdbId+"/img",
    }
}

builder.defineCatalogHandler(function(args, cb) {
    // filter the dataset object and only take the requested type
    const metas = Object.entries(dataset)
	.filter(([_, value]) => value.type === args.type)
	.map(([key, value]) => generateMetaPreview(value, key))

    return Promise.resolve({ metas: metas })
})

module.exports = builder.getInterface()
