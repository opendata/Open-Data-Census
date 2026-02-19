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

    initMap(place_colors, state_abbreviations);

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

function initMap(place_colors, abbr_to_name) {
    var fipsToAbbr = {
        "01": "al", "02": "ak", "04": "az", "05": "ar", "06": "ca",
        "08": "co", "09": "ct", "10": "de", "11": "dc", "12": "fl",
        "13": "ga", "15": "hi", "16": "id", "17": "il", "18": "in",
        "19": "ia", "20": "ks", "21": "ky", "22": "la", "23": "me",
        "24": "md", "25": "ma", "26": "mi", "27": "mn", "28": "ms",
        "29": "mo", "30": "mt", "31": "ne", "32": "nv", "33": "nh",
        "34": "nj", "35": "nm", "36": "ny", "37": "nc", "38": "nd",
        "39": "oh", "40": "ok", "41": "or", "42": "pa", "44": "ri",
        "45": "sc", "46": "sd", "47": "tn", "48": "tx", "49": "ut",
        "50": "vt", "51": "va", "53": "wa", "54": "wv", "55": "wi",
        "56": "wy", "72": "pr"
    };

    var projection = d3.geoAlbersUsa().scale(1280).translate([480, 300]);
    var path = d3.geoPath().projection(projection);

    var svg = d3.select("#vmap").append("svg")
        .attr("viewBox", "0 0 960 600")
        .attr("preserveAspectRatio", "xMidYMid meet");

    d3.json("/grid/data/us-states.json").then(function(us) {
        svg.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "state")
            .style("fill", function(d) {
                var abbr = fipsToAbbr[String(d.id).padStart(2, "0")];
                return place_colors[abbr] || "#eee";
            })
            .on("click", function(event, d) {
                var abbr = fipsToAbbr[String(d.id).padStart(2, "0")];
                var name = abbr_to_name[abbr];
                if (name) window.location.href = "/datasets.html?state=" + encodeURIComponent(name);
            })
            .append("title")
            .text(function(d) {
                var abbr = fipsToAbbr[String(d.id).padStart(2, "0")] || "";
                return abbr_to_name[abbr] || abbr.toUpperCase();
            });
    });
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
