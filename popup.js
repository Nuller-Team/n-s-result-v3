window.onload = function () {
    setTimeout(function () {
        document.getElementById("load").classList.add("load");
    }, 1000);
};
chrome.storage.local.get('updated', function (result) {
    if (result.updated) {
        document.getElementById("reports").style.display = "block";
        var updated = new Date(result.updated);
        document.getElementById("last_update").innerText = "最終更新: "+updated.getFullYear()+"/"+(updated.getMonth()+1)+"/"+updated.getDate()+" "+updated.getHours()+":"+updated.getMinutes();
    } else {
        document.getElementById("no_data").style.display = "flex";
        document.getElementById("reports").style.display = "none";
    }
});
chrome.storage.local.get('result_page', function (result) {
    if (result.result_page) {
        var url = new URL(result.result_page);
        url.searchParams.set("mode", "new");
        document.getElementById("open_btn").href = url.href;
    } else {
        document.getElementById("open_btn").style.color = "var(--gray-text)";
        document.getElementById("open_btn").style.cursor = "not-allowed";
    }
});
chrome.storage.local.get('reports', function (result) {
    if (!result.reports) return;
    var reports = result.reports;
    var reports_div = document.getElementById("reports");
    var next = null;
    for (var month in reports["reports"]) {
        var m_report = reports["reports"][month];
        var done = true;
        for (var subject in m_report) {
            if (m_report[subject]["done"] !== "100%") {
                done = false;
                break;
            }
        }
        if (!done) {
            next = month;
            break;
        }
    }
    if (next === null) {
        reports_div.style.display = "none";
        document.getElementById("end_reports").style.display = "flex";
        return;
    }
    var report = reports["reports"][next];
    var title = document.createElement("span");
    title.innerText = next.split("/")[0]+"年"+Number(next.split("/")[1])+"月";
    title.style.borderBottom = "2px solid var(--gray-text)";
    title.style.fontSize = "16px";
    title.style.fontWeight = "bold";
    title.style.display = "block";
    title.style.margin = "0px -5px";
    title.style.marginBottom = "10px";
    title.style.padding = "5px 2px";
    reports_div.append(title);
    for (var subject in report) {
        var subject_div = document.createElement("div");
        subject_div.style.display = "flex";
        subject_div.style.flexWrap = "wrap";
        subject_div.style.justifyContent = "space-between";
        subject_div.style.alignItems = "center";
        subject_div.style.marginBottom = "5px";
        var subject_name = document.createElement("span");
        subject_name.innerText = subject;
        subject_name.style.fontSize = "14px";
        subject_name.style.overflow = "hidden";
        subject_name.style.textOverflow = "ellipsis";
        subject_name.style.whiteSpace = "nowrap";
        subject_name.style.width = "calc(100% - 50px)";
        subject_div.append(subject_name);
        var subject_done_parent = document.createElement("div");
        var subject_done = document.createElement("span");
        subject_done.innerText = report[subject]["done"].replace("%", "");
        subject_done.style.fontSize = "14px";
        subject_done.style.fontWeight = "bold";
        subject_done_parent.append(subject_done);
        var span = document.createElement("span");
        span.style.fontSize = "12px";
        span.style.marginLeft = "2px";
        span.innerText = "%";
        subject_done_parent.append(span);
        subject_div.append(subject_done_parent);
        var subject_percent = document.createElement("div");
        subject_percent.style.width = "100%";
        subject_percent.style.height = "5px";
        subject_percent.style.borderRadius = "10px";
        subject_percent.style.marginBottom = "5px";
        subject_percent.style.overflow = "hidden";
        subject_percent.style.background = "var(--gray)";
        var subject_percent_done = document.createElement("div");
        subject_percent_done.style.width = report[subject]["done"];
        subject_percent_done.style.height = "100%";
        subject_percent_done.style.borderRadius = "10px";
        subject_percent_done.style.background = "var(--green)";
        subject_percent.append(subject_percent_done);
        subject_div.append(subject_percent);
        reports_div.append(subject_div);
    }
});