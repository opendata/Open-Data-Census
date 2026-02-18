$(document).ready(function() {
    showInfo();
    $('.table-responsive').doubleScroll();
});

var rawData = [];

function showInfo() {

    /* Put together data for the map. */
    var state_abbreviations = {
        "al": "Alabama",
        "ar": "Arkansas",
        "az": "Arizona",
        "ak": "Alaska",
        "ca": "California",
        "co": "Colorado",
        "ct": "Connecticut",
        "de": "Delaware",
        "fl": "Florida",
        "ga": "Georgia",
        "hi": "Hawaii",
        "id": "Idaho",
        "il": "Illinois",
        "in": "Indiana",
        "ia": "Iowa",
        "ks": "Kansas",
        "ky": "Kentucky",
        "la": "Louisiana",
        "me": "Maine",
        "md": "Maryland",
        "ma": "Massachusetts",
        "ms": "Mississippi",
        "mi": "Michigan",
        "mn": "Minnesota",
        "mo": "Missouri",
        "mt": "Montana",
        "ne": "Nebraska",
        "nv": "Nevada",
        "nh": "New Hampshire",
        "nj": "New Jersey",
        "nm": "New Mexico",
        "ny": "New York",
        "nc": "North Carolina",
        "nd": "North Dakota",
        "oh": "Ohio",
        "ok": "Oklahoma",
        "or": "Oregon",
        "pa": "Pennsylvania",
        "pr": "Puerto Rico",
        "ri": "Rhode Island",
        "sc": "South Carolina",
        "sd": "South Dakota",
        "tn": "Tennessee",
        "tx": "Texas",
        "ut": "Utah",
        "vt": "Vermont",
        "va": "Virginia",
        "wa": "Washington",
        "dc": "Washington DC",
        "wv": "West Virginia",
        "wi": "Wisconsin",
        "wy": "Wyoming"
    };

    rawData = window.placesData;
    var place_scores = {};
    for (var key in rawData) {
        name = rawData[key]['Name'];
        for (var key2 in state_abbreviations) {
            if (state_abbreviations[key2] == name) {
                abbreviation = key2;
            }
        }
        place_scores[abbreviation] = rawData[key]['Score'];
    }

    var score_colors = {
        "20": "#f7fbff",
        "30": "#deebf7",
        "40": "#c6dbef",
        "50": "#9ecae1",
        "60": "#6baed6",
        "70": "#4292c6",
        "80": "#2171b5",
        "90": "#084594",
    };

    var place_colors = {};
    for (var key in place_scores) {
        score = Math.floor(place_scores[key] / 10) * 10;
        if (score < 20) score = 20;
        place_colors[key] = score_colors[score];
    }

    $('#vmap').vectorMap({
        map: 'usa_en',
        backgroundColor: null,
        color: '#eee',
        showTooltip: true,
        showLabels: true,
        selectedColor: null,
        hoverColor: "#f66",
        colors: place_colors,
        onRegionClick: function(event, code, region) {
            event.preventDefault();
            window.location.href = "/datasets.html?state=" + region;
        }
    });

    /* Now create the table of data. */
    var stateTemplate = Handlebars.compile($("#state-template").html());

    rawData = window.censusData;
    var allTypes = _.chain(rawData).map(function(row) {
            return row["Type of Data"];
        })
        .unique()
        .value();

    setupDatatypes(allTypes);

    /* Reverse the state abbreviations' keys and values. */
    reversed = {};
    for (var key in state_abbreviations) {
        reversed[state_abbreviations[key]] = key;
    }
    state_abbreviations = reversed;

    var rows = _.chain(rawData)
        .groupBy("State")
        .map(function(datasets, state) {
            var row = {
                state: state,
                state_score: place_scores[state_abbreviations[state]] + "%",
                state: datasets[0]["State"],
                stateHref: URI().filename("datasets.html").search({
                    "state": state
                }).toString(),
                datasets: []
            };

            _.each(allTypes, function(type) {
                var foundDataset = _.find(datasets, function(dataset) {
                    return dataset["Type of Data"] === type;
                });
                if (foundDataset) {
                    var gridData = {
                        grade: foundDataset["Grade"],
                        score: foundDataset["Score"],
                        datasetHref: URI().filename("datasets.html").search({
                            "state": row["state"],
                            "datatype": foundDataset["Type of Data"]
                        })
                    };

                    for (var index in gridData) {
                        if (!gridData[index]) {
                            gridData[index] = "DNE";
                        }
                    }

                    row["datasets"].push(gridData).toString();
                }
            });
            return row;
        })
        .sortBy("state")
        .each(function(row) {
            var html = stateTemplate(row);
            $("#states").append(html);
        })
        .value();
    $('[data-toggle="tooltip"]').tooltip();
}

function setupDatatypes(allTypes) {
    var datatypes = _.chain(allTypes).map(function(type) {
            return {
                "datatype": type,
                "datatypeHref": URI().filename(type.replace(/ /g, '') + ".html").toString()
            };
        })
        .unique()
        .value();
    var datasetTemplate = Handlebars.compile($("#dataset-template").html());
    var datasetHtml = datasetTemplate(datatypes);
    $("#datasets").append(datasetHtml);
}
