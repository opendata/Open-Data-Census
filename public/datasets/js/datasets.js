var allRows = [];

$(document).ready(function() {
    showInfo();
});

function showInfo() {
    allRows = _.sortBy(window.censusData, "State");

    var uri = new URI();
    var params = uri.search(true);

    if (params) {
        var filters = [];
        filters.push(buildStateFilter(params["state"]));
        filters.push(buildDatatypeFilter(params["datatype"]));
        updateCards(allRows, _.compact(filters));
    } else {
        updateCards(allRows);
    }
}

function updateCards(rows, filters) {
    var filters = filters || [];
    var source = $("#card-template").html();
    var template = Handlebars.compile(source);

    _.chain(rows)
        .filter(function(row) {
            return _.all(filters, function(filter) {
                return filter(row);
            });
        })
        .map(function(row) {

            row.exists = row["Exists"];
            row.digitized = row["Digitized"];
            row.isPublic = row["Public"];
            row.free = row["Free"];
            row.online = row["Online"];
            row.machine = row["Machine readable"];
            row.bulk = row["Available in bulk"];
            row.openLicense = row["No restrictions"];
            row.fresh = row["Up-to-date"];
            row.inRepo = row["In the state repository"];
            row.verifiable = row["Verifiable"];
            row.complete = row["Complete"];
            row.grade = row["Grade"];
            row.score = row["Score"];

            row.existsCaption = captions.exists[row.exists];
            row.digitizedCaption = captions.digitized[row.digitized];
            row.isPublicCaption = captions.isPublic[row.isPublic];
            row.freeCaption = captions.free[row.free];
            row.onlineCaption = captions.online[row.online];
            row.machineCaption = captions.machine[row.machine];
            row.bulkCaption = captions.bulk[row.bulk];
            row.openLicenseCaption = captions.openLicense[row.openLicense];
            row.freshCaption = captions.fresh[row.fresh];
            row.inRepoCaption = captions.inRepo[row.inRepo];
            row.verifiableCaption = captions.verifiable[row.verifiable];
            row.completeCaption = captions.complete[row.complete];

            var html = template(row);
            $("#cards").append(html);
            $('[data-toggle="tooltip"]').tooltip();
        });
}

function buildStateFilter(state) {
    if (!state) {
        return false;
    }
    return function(row) {
        return row["State"] === state;
    };
}

function buildDatatypeFilter(datatype) {
    if (!datatype) {
        return false;
    }
    return function(row) {
        return row["Type of Data"] === datatype;
    };
}

function clearCards() {
    $("#cards").empty();
}

function filterByState(state) {
    clearCards();
    updateCards(allRows, [buildStateFilter(state)]);
}

function resetSearch() {
    clearCards();
    updateCards(allRows);
}

function filterByDatatype(datatype) {
    clearCards();
    updateCards(allRows, [buildDatatypeFilter(datatype)]);
}

function filterByMachineReadable(machineReadable) {
    clearCards();
    updateCards(_.filter(allRows, function(row) {
        return machineReadable ? row["Machine readable"] === "yes" : row["Machine readable"] === "no";
    }));
}
