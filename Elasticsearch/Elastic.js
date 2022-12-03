// LRU instead of most recent docs
// change index settings
// change code to map

// try queueing writes

const { Client } = require('@elastic/elasticsearch');
const express = require('express');

const app = express();
app.use(express.json());

const elasticClient = new Client({
    node: 'http://localhost:9200'
});

app.get('/elastic', (req, res) => {
    res.send('slash elastic');
});

// TODO: document name and using fvh or unified highlighting
app.post('/elastic/create', async (req, res) => {
    try {
        const result = await elasticClient.indices.create({
            index: 'docs',
            body: {
                "settings": {
                    "analysis": {
                        "analyzer": {
                            "my_analyzer": {
                                "tokenizer": "whitespace",
                                "filter": [ "stop", "porter_stem" ],
                                "type": "custom"
                            }
                        }
                    }
                },
                "mappings": {
                      "properties": {
                        "name": {
                          "type": "text",
                          "analyzer": "my_analyzer",
                          "term_vector": "with_positions_offsets_payloads",
                          "store": true,
                          "fields": {
                            "keyword": {
                              "type": "keyword",
                              "ignore_above": 256
                            }
                          }
                        },
                        "text": {
                          "type": "text",
                          "term_vector": "with_positions_offsets_payloads",
                          "store": true,
                          "analyzer": "my_analyzer",
                          "fields": {
                            "keyword": {
                              "type": "keyword",
                              "ignore_above": 256
                            }
                          }
                        }
                      }
                  }
            }
        });

        res.send(result);
    }
    catch (e) {
        console.log(e);

        res.send({ error: true, message: e.name, detail: e.meta });
    }
});

app.post('/elastic/index', async (req, res) => {
    const { id, name, text } = req.body;

    try {
        const result = await elasticClient.index({
            index: 'docs',
            // type: 'doc',
            id: id,
            body: {
                name: name,
                text: text,
            },
        });

        res.send(result);
    }
    catch (e) {
        res.send({ error: true, message: e.name });
    }
});

app.post('/elastic/search', async (req, res) => {
    const { query } = req.body;

    try {
        const result = await elasticClient.search({
            index: 'docs',
            query: {
                'multi_match': {
                    'query': query,
                    'fields': ['name', 'text']
                }
                // 'match_phrase': {
                    // 'name': query,
                    // 'text': query,
                // }
            },
            highlight: {
                'fields': {
                    'name': {},
                    'text': {},
                },
                'type': 'fvh',
                // 'boundary_scanner': 'words',
                // 'fragment_offset': 10,
                'fragment_size': 105,
            }
        });

        const hits = result.hits.hits.slice(0, 10);
        const searchResults = [];
        for (let hit of hits) {

            const snippet = (hit.highlight.text === undefined) ? hit.highlight.name[0] : hit.highlight.text[0];
            searchResults.push({ docid: hit._id, name: hit._source.name, snippet: snippet });
        }

        res.send(searchResults);
    }
    catch (e) {
        res.send({ error: true, message: e.name, detail: e.meta });
    }
});

app.post('/elastic/suggest', async (req, res) => {
    const { query } = req.body;

    try {
        const result = await elasticClient.search({
            index: 'docs',
            query: {
                'prefix': {
                    'text': query
                }
            },
            highlight: {
                'fields': {
                    'text': {}
                },
                'fragment_size': 1,
                'pre_tags': [""],
                'post_tags': [""]
            }
        });
        
        const suggestions = new Set();
        for (let hit of result.hits.hits) {

            const text = hit.highlight.text[0];
            if (text !== query)
                suggestions.add(hit.highlight.text[0]);

        }
        res.send(Array.from(suggestions));
    }
    catch (e) {
        res.send({ error: true, message: e.name, detail: e.meta });
    }
});

app.post('/elastic/delete', async (req, res) => {
    const { id } = req.body;
    
    try {
        const result = await elasticClient.delete({
            index: 'docs',
            id: id,
        });

        res.send(result);
    }
    catch (e) {
        res.send({ error: true, message: e.name, detail: e.meta });
    }
});

const port = 5602;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
