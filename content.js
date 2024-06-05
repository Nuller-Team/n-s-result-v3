function parse_report() {
    var result = document.getElementById("nsresult_custom_table") || document.getElementById("result_table");
    var cols = result.querySelector(".header_item_names").children[1].colSpan-1;
    var sj1 = result.querySelectorAll(".subject_1st_row");
    var sj2 = result.querySelectorAll(".subject_2st_row");
    var select_year = document.getElementById("nsresult-select-year");
    if (select_year === null) select_year = document.getElementById("studentTermId");
    var oyear = Number(select_year.options[select_year.selectedIndex].innerText.split("年")[0]);
    var reports = {};
    for (let i=0;i<sj1.length;i++){
        var sj = sj1[i];
        var st = sj2[i*2];
        var sp = sj2[i*2+1];
        if (sj === undefined || st === undefined || sp === undefined) continue;
        var cname = sj.children[0].innerText.replace("\n"," ");
        var year = oyear;
        var llm = 0;
        for (let lo=0;lo<cols;lo++){
            var lm = sj.children[lo+2];
            if (lm.innerText=="-") continue;
            var m = Number(lm.innerText.split("/")[0]);
            var d = Number(lm.innerText.split("/")[1]);
            if (llm > m) {
                year = year+1;
            }
            llm = m;
            var tday = year+"/"+m.toString().padStart(2,"0")+"/"+d.toString().padStart(2,"0");
            if (reports[tday] === undefined) reports[tday] = {};
            if (reports[tday][cname] === undefined) reports[tday][cname] = [];
            reports[tday][cname].push({"done":st.children[lo+1].innerText,"score":sp.children[lo+1].innerText});
        }
    }
    return {"reports":reports};
}

function gen_month_select(select_month, report) {
    select_month.innerHTML = "";
    var selected = false;
    Object.keys(report.reports).sort().forEach(e=>{
        var option = document.createElement("option");
        option.value = e;
        option.innerText = e;
        if (!selected && Object.values(report.reports[e]).some(e=>e.some(e=>e.done !== "100%"))) {
            option.selected = true;
            selected = true;
        }
        select_month.append(option);
    });
    var option = document.createElement("option");
    option.value = "all";
    option.innerText = "全期間";
    if (!selected) option.selected = true;
    select_month.append(option);
    var now_query = new URLSearchParams(location.search);
    var now_month = now_query.get("month");
    if (now_month !== null) {
        for (let i=0;i<select_month.children.length;i++){
            if (select_month.children[i].value === now_month) {
                select_month.value = now_month;
                break;
            }
        }
    }
    select_month.onchange = function(){
        write_report(true);
    }
}

function load_year() {
    var main = document.getElementById("nsresult");
    var load = cload();
    load.style.animation = "fadein 0.25s";
    main.append(load);
    var year = document.getElementById("nsresult-select-year").value;
    var url = new URL(window.location.href);
    url.searchParams.set("studentTermId",year);
    url.searchParams.set("mode","new");
    var ajax = new XMLHttpRequest();
    ajax.open("GET",url.href,true);
    ajax.onload = function(){
        var table = document.getElementById("nsresult_custom_table");
        if (table === null){
            var table_parent = document.createElement("div");
            table_parent.style.height = "0px";
            table_parent.style.width = "0px";
            table_parent.style.overflow = "hidden";
            table_parent.style.opacity = "0";
            table = document.createElement("table");
            table.id = "nsresult_custom_table";
            table_parent.append(table);
            main.append(table_parent);
        }
        var table_html = ajax.responseText.split('<table id="result_table">')[1];
        if (table_html === undefined) {
            location.href = url.href;
        }
        table.innerHTML = table_html.split("</table>")[0];
        var select_month = document.getElementById("nsresult-select-month");
        var report = parse_report();
        gen_month_select(select_month, report);
        write_report();
        load.style.animation = "fadeout 0.25s";
        load.style.opacity = "0";
        setTimeout(function(){
            load.remove();
        },250);
    }
    ajax.send();
}

function cload() {
    var load = document.createElement("div");
    load.id = "load";
    load.style.position = "fixed";
    load.style.top = "0";
    load.style.left = "0";
    load.style.width = "100%";
    load.style.height = "100%";
    load.style.zIndex = "1005";
    load.style.background = "var(--back)";
    load.style.display = "flex";
    var load_div = document.createElement("div");
    load_div.style.margin = "auto";
    var load_logo = document.createElement("img");
    load_logo.src = chrome.runtime.getURL("icon.svg");
    load_logo.style.width = "60px";
    load_logo.style.height = "60px";
    load_logo.style.filter = "var(--logo-filter)";
    load_div.append(load_logo);
    var load_circle = document.createElement("div");
    load_circle.style.width = "20px";
    load_circle.style.height = "20px";
    load_circle.style.borderTop = "solid 3px var(--text)";
    load_circle.style.borderLeft = "solid 3px var(--gray)";
    load_circle.style.borderBottom = "solid 3px var(--gray)";
    load_circle.style.borderRight = "solid 3px var(--gray)";
    load_circle.style.borderRadius = "50%";
    load_circle.style.animation = "spin 0.5s linear infinite";
    load_circle.style.margin = "5px auto auto auto";
    load_div.append(load_circle);
    load.append(load_div);
    return load;
}

function get_color(theme, name) {
    var colors = {"light": {"text": "#333", "gray": "#ddd", "grayb": "#eee", "gray-text": "#999", "back": "#f5f5f5", "hback": "#fff", "red":"#ff3333", "green": "#58C07F"}, "dark": {"text": "#eee", "gray": "#555", "grayb": "#333", "gray-text": "#999", "back": "#222", "hback": "#323232", "green": "#4ab06c", "logo-filter": "invert(99%) sepia(3%) saturate(1245%) hue-rotate(218deg) brightness(111%) contrast(87%)"}};
    if (colors[theme][name] === undefined) return colors["light"][name];
    return colors[theme][name];
}

function create_share() {
    if (document.getElementById("nsresult-share") !== null) return;
    var end = document.getElementById("nsresult-select-month").value;
    var div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "0";
    div.style.left = "0";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.zIndex = "1000";
    div.style.background = "rgba(0,0,0,0.5)";
    div.style.color = "var(--text)";
    div.style.display = "flex";
    div.style.animation = "fadein 0.25s";
    div.style.overflow = "auto";
    div.id = "nsresult-share";
    var div_parent = document.createElement("div");
    div_parent.style.margin = "auto";
    div_parent.style.maxWidth = "500px";
    div_parent.style.width = "100%";
    div_parent.style.padding = "20px";
    div_parent.style.background = "var(--hback)";
    var header = document.createElement("div");
    header.style.width = "100%";
    header.style.display = "flex";
    header.style.marginBottom = "20px";
    var title = document.createElement("h2");
    title.style.margin = "0px";
    title.style.fontSize = "24px";
    title.innerText = "共有";
    header.append(title);
    var close = document.createElement("button");
    close.style.margin = "auto 0px";
    close.style.marginLeft = "auto";
    close.style.padding = "5px";
    close.style.border = "none";
    close.style.borderRadius = "5px";
    close.style.background = "#f33";
    close.style.color = "#fff";
    close.style.cursor = "pointer";
    close.style.display = "flex";
    close.classList.add("nsresult-btn");
    close.onclick = function(){
        div.style.animation = "fadeout 0.25s";
        div.style.opacity = "0";
        setTimeout(function(){
            div.remove();
        },250);
    }
    div.onclick = function(e){
        if (e.target === div) {
            close.click();
        }
    }
    var close_icon = document.createElement("div");
    close_icon.innerText = "close";
    close_icon.className = "material-symbols-outlined";
    close_icon.style.margin = "auto";
    close.append(close_icon);
    var close_text = document.createElement("div");
    close_text.innerText = "閉じる";
    close_text.style.margin = "auto";
    close_text.style.marginRight = "5px";
    close_text.style.fontSize = "15px";
    close.append(close_text);
    header.append(close);
    div_parent.append(header);
    var img = new Image();
    img.id = "nsresult-share-image";
    img.style.width = "100%";
    var img_div = document.createElement("div");
    img_div.style.margin = "auto";
    img_div.style.width = "100%";
    img_div.style.display = "flex";
    var img_parent = document.createElement("div");
    img_parent.style.margin = "auto";
    img_parent.append(img);
    img_div.append(img_parent);
    div_parent.append(img_div);
    var controller = document.createElement("div");
    var control_dark = document.createElement("div");
    control_dark.style.display = "flex";
    var is_dark = document.createElement("input");
    is_dark.type = "checkbox";
    is_dark.className = "switch";
    is_dark.id = "nsresult-share-dark";
    is_dark.onchange = function(){
        generate_share_image();
    }
    control_dark.append(is_dark);
    var label = document.createElement("label");
    label.style.margin = "auto 0px";
    label.style.width = "100%";
    label.htmlFor = "nsresult-share-dark";
    label.innerText = "ダークモード";
    control_dark.append(label);
    controller.append(control_dark);
    if (end === "all") {
        var control_month = document.createElement("div");
        control_month.style.display = "flex";
        var is_month = document.createElement("input");
        is_month.type = "checkbox";
        is_month.className = "switch";
        is_month.id = "nsresult-share-ismonth";
        is_month.onchange = function(){
            generate_share_image();
        }
        control_month.append(is_month);
        var label = document.createElement("label");
        label.style.margin = "auto 0px";
        label.style.width = "100%";
        label.htmlFor = "nsresult-share-ismonth";
        label.innerText = "月ごと";
        control_month.append(label);
        controller.append(control_month);
    }
    var control_done = document.createElement("div");
    control_done.style.display = "flex";
    var is_done = document.createElement("input");
    is_done.type = "checkbox";
    is_done.className = "switch";
    is_done.id = "nsresult-share-isdone";
    is_done.onchange = function(){
        generate_share_image();
    }
    control_done.append(is_done);
    var label = document.createElement("label");
    label.style.margin = "auto 0px";
    label.style.width = "100%";
    label.htmlFor = "nsresult-share-isdone";
    label.innerText = "提出数表示";
    control_done.append(label);
    controller.append(control_done);
    div_parent.append(controller);
    var actions = document.createElement("div");
    actions.style.width = "100%";
    actions.style.display = "flex";
    actions.style.whiteSpace = "nowrap";
    var download_btn = document.createElement("button");
    download_btn.style.width = "100%";
    download_btn.style.padding = "10px";
    download_btn.style.border = "none";
    download_btn.style.borderRadius = "5px";
    download_btn.style.background = "var(--green)";
    download_btn.style.color = "#fff";
    download_btn.style.cursor = "pointer";
    download_btn.style.marginTop = "20px";
    download_btn.style.display = "flex";
    download_btn.classList.add("nsresult-btn");
    download_btn.onclick = function(){
        var a = document.createElement("a");
        a.href = document.getElementById("nsresult-share-image").src;
        a.download = "nsresult_share.png";
        a.click();
    }
    var download_icon = document.createElement("div");
    download_icon.style.margin = "auto";
    download_icon.style.marginRight = "0px";
    download_icon.innerText = "download";
    download_icon.className = "material-symbols-outlined";
    download_btn.append(download_icon);
    var download_text = document.createElement("div");
    download_text.innerText = "ダウンロード";
    download_text.style.margin = "auto 0px";
    download_text.style.marginLeft = "5px";
    download_text.style.marginRight = "auto";
    download_text.style.fontSize = "15px";
    download_btn.append(download_text);
    actions.append(download_btn);
    var copy_btn = document.createElement("button");
    copy_btn.style.padding = "10px";
    copy_btn.style.marginLeft = "10px";
    copy_btn.style.border = "none";
    copy_btn.style.borderRadius = "5px";
    copy_btn.style.background = "var(--green)";
    copy_btn.style.color = "#fff";
    copy_btn.style.cursor = "pointer";
    copy_btn.style.marginTop = "20px";
    copy_btn.style.display = "flex";
    copy_btn.classList.add("nsresult-btn");
    copy_btn.onclick = function(){
        var share_img = document.getElementById('nsresult-share-image');
        var canvas = document.createElement('canvas');
        canvas.width = share_img.naturalWidth;
        canvas.height = share_img.naturalHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(share_img, 0, 0);
        canvas.toBlob(async (blob) => {
            var item = new ClipboardItem({
                'image/png': blob
            });
            await navigator.clipboard.write([item]);
            alert("クリップボードにコピーしました。");
        });
    }
    var copy_icon = document.createElement("div");
    copy_icon.style.margin = "auto";
    copy_icon.style.marginRight = "0px";
    copy_icon.innerText = "content_copy";
    copy_icon.className = "material-symbols-outlined";
    copy_btn.append(copy_icon);
    var copy_text = document.createElement("div");
    copy_text.innerText = "コピー";
    copy_text.style.margin = "auto 0px";
    copy_text.style.marginLeft = "5px";
    copy_text.style.marginRight = "auto";
    copy_text.style.fontSize = "15px";
    copy_btn.append(copy_text);
    actions.append(copy_btn);
    var share_btn = document.createElement("button");
    share_btn.style.padding = "10px";
    share_btn.style.marginLeft = "10px";
    share_btn.style.border = "none";
    share_btn.style.borderRadius = "5px";
    share_btn.style.background = "#1da1f2";
    share_btn.style.color = "#fff";
    share_btn.style.cursor = "pointer";
    share_btn.style.marginTop = "20px";
    share_btn.style.display = "flex";
    share_btn.classList.add("nsresult-btn");
    share_btn.onclick = function(){
        var meta = JSON.parse(document.getElementById("nsresult-share-meta").value);
        var end = meta.end;
        var text = (end==="all"?"全期間":end.split("/")[0]+"年"+end.split("/")[1]+"月")+"のレポートの進捗状況 "+meta.perc+"%\n完了済み: "+meta.report_done+"/"+meta.report_count;
        var share_url = "https://x.com/intent/tweet?text="+encodeURIComponent(text)+"&hashtags=NSResult";
        if (confirm("ツイート画面が開きます。\n画像は手動で添付して下さい。")){
            window.open(share_url, "_blank");
        }
    }
    var share_icon = document.createElement("div");
    share_icon.style.margin = "auto";
    share_icon.style.marginRight = "0px";
    share_icon.innerText = "share";
    share_icon.className = "material-symbols-outlined";
    share_btn.append(share_icon);
    var share_text = document.createElement("div");
    share_text.innerText = "ツイート";
    share_text.style.margin = "auto 0px";
    share_text.style.marginLeft = "5px";
    share_text.style.marginRight = "auto";
    share_text.style.fontSize = "15px";
    share_btn.append(share_text);
    actions.append(share_btn);
    div_parent.append(actions);
    div.append(div_parent);
    var meta_input = document.createElement("input");
    meta_input.type = "hidden";
    meta_input.id = "nsresult-share-meta";
    div.append(meta_input);
    document.body.append(div);
    generate_share_image();
}

function generate_share_image() {
    var report = parse_report();
    var theme = document.getElementById("nsresult-share-dark").checked?"dark":"light";
    var ismonth = document.getElementById("nsresult-share-ismonth")===null?false:document.getElementById("nsresult-share-ismonth").checked;
    var isdone = document.getElementById("nsresult-share-isdone").checked;
    var end = document.getElementById("nsresult-select-month").value;
    var done = 0;
    var total = 0;
    var report_count = 0;
    var report_done = 0;
    var color_back = get_color(theme, "back");
    var color_header = get_color(theme, "hback");
    var color_text = get_color(theme, "text");
    var targets = [];
    if (end === "all") {
        targets = Object.keys(report.reports);
    } else {
        targets = [end];
    }
    for (let i in targets){
        var r = report.reports[targets[i]];
        for (let j in r){
            for (let k in r[j]){
                report_count += 1;
                if (r[j][k].done === "100%") report_done++;
                done += Number(r[j][k].done.replace("%",""));
                total += 100;
            }
        }
    }
    var perc = Math.floor(done/total*100);
    document.getElementById("nsresult-share-meta").value = JSON.stringify({"end":end,"perc":perc,"report_count":report_count,"report_done":report_done});
    var canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = color_back;
    ctx.fillRect(0,0,1920,1080);
    ctx.fillStyle = color_header;
    ctx.fillRect(0,0,1920,150);
    ctx.font = "bold 80px 'Noto Sans JP'";
    ctx.fillStyle = color_text;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(end==="all"?"全期間":end.split("/")[0]+"年"+end.split("/")[1]+"月",50,35);
    ctx.fillStyle = perc===100?get_color(theme, "green"):get_color(theme, "red");
    ctx.textAlign = "right";
    if (isdone) {
        ctx.fillText(report_done+"/"+report_count,1885,35);
    } else {
        ctx.fillText(perc+"%",1885,35);
    }
    ctx.textAlign = "left";
    var rps = {};
    if (ismonth) {
        for (let i in targets){
            var r = report.reports[targets[i]];
            var rn = targets[i];
            for (let j in r){
                for (let k in r[j]){
                    rps[rn] = rps[rn] || [];
                    rps[rn]["count"] = rps[rn]["count"] || 0;
                    rps[rn]["count"]++;
                    rps[rn]["done_count"] = rps[rn]["done_count"] || 0;
                    if (r[j][k].done === "100%") {
                        rps[rn]["done_count"]++;
                    }
                    rps[rn]["done"] = rps[rn]["done"] || 0;
                    rps[rn]["done"] += Number(r[j][k].done.replace("%",""));
                }
            }
        }
    } else {
        for (let i in targets){
            var r = report.reports[targets[i]];
            for (let j in r){
                for (let k in r[j]){
                    rps[j] = rps[j] || [];
                    rps[j]["count"] = rps[j]["count"] || 0;
                    rps[j]["count"]++;
                    rps[j]["done_count"] = rps[j]["done_count"] || 0;
                    if (r[j][k].done === "100%") {
                        rps[j]["done_count"]++;
                    }
                    rps[j]["done"] = rps[j]["done"] || 0;
                    rps[j]["done"] += Number(r[j][k].done.replace("%",""));
                }
            }
        }
    }
    for (let i in rps){
        rps[i]["done"] = Math.floor(rps[i]["done"]/rps[i]["count"]);
    }
    var rps_count = Object.keys(rps).length;
    var n = 0;
    var y = 180;
    var rx = 50;
    var x = rx;
    var w = 1800;
    var add_x = 1920;
    var add_y = 125;
    if (rps_count >= 7) {
        w = 860;
        add_x = 940;
    }
    if (rps_count >= 14) {
        w = 560;
        add_x = 620;
    }
    x -= add_x;
    var h = 100;
    for (let j in rps){
        var js = j.split(" ");
        x += add_x;
        if (x+w > 1900) {
            x = rx;
            y += add_y;
        }
        ctx.fillStyle = color_back;
        ctx.fillRect(x,y,w,h);
        ctx.fillStyle = color_text;
        ctx.font = "bold 48px 'Noto Sans JP'";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        cname = js[0];
        if (w === 560 && cname.length >= 9) {
            cname = cname.slice(0,8)+"...";
        }
        if (w === 860 && cname.length >= 10) {
            cname = cname.slice(0,9)+"...";
        }
        ctx.fillText(cname,x+10,y+10);
        ctx.font = "48px 'Noto Sans JP'";
        ctx.font = "bold 48px 'Noto Sans JP'";
        ctx.textAlign = "right";
        var done = rps[j].done;
        var rg = done === 100?get_color(theme, "green"):get_color(theme, "red");
        ctx.fillStyle = rg;
        if (isdone) {
            ctx.fillText(rps[j]["done_count"]+"/"+rps[j]["count"],x+w+10,y+10);
            done = Math.floor(rps[j]["done_count"]/rps[j]["count"]*100);
        } else {
            ctx.fillText(rps[j].done,x+w-25,y+10);
            ctx.font = "30px 'Noto Sans JP'";
            ctx.fillText("%",x+w+10,y+10+16);
        }
        ctx.fillStyle = get_color(theme, "gray");
        ctx.fillRect(x+10,y+80,w,10);
        ctx.fillStyle = rg;
        ctx.fillRect(x+10,y+80,w*(done/100),10);
        n++;
    }
    var logo_img = new Image();
    logo_img.src = chrome.runtime.getURL("logo.svg");
    logo_img.onload = function(){
        ctx.filter = get_color(theme, "logo-filter");
        ctx.drawImage(logo_img, 1920-logo_img.width-30, 1080-logo_img.height-30, logo_img.width, logo_img.height);
        document.getElementById("nsresult-share-image").src = canvas.toDataURL();
    }
}

function write_report(change=false) {
    if (change) {
        var n = 0;
        document.querySelectorAll("#nsresult .anim").forEach(e=>{
            var tn = 0;
            if (e.children.length != 0) {
                Array.from(e.children).forEach(el=>{
                    el.style.opacity = "1";
                    el.style.animation = "slideout 0.25s ease "+((tn+n)*0.025)+"s forwards";
                    tn++;
                });
            }
            e.style.opacity = "1";
            e.style.animation = "slideout 0.25s ease "+((n+2)*0.025)+"s forwards";
            n++;
        });
        setTimeout(function(){
            write_report();
        },500);
        return;
    }
    var report = parse_report();
    var end = document.getElementById("nsresult-select-month").value;
    var now = new Date();
    var done = 0;
    var total = 0;
    var report_count = 0;
    var report_done = 0;
    var targets = [];
    if (end === "all") {
        targets = Object.keys(report.reports);
    } else {
        targets = [end];
    }
    for (let i in targets){
        var r = report.reports[targets[i]];
        for (let j in r){
            for (let k in r[j]){
                report_count += 1;
                if (r[j][k].done === "100%") report_done++;
                done += Number(r[j][k].done.replace("%",""));
                total += 100;
            }
        }
    }
    var perc = Math.floor(done/total*100);
    var main = document.getElementById("nsresult-main");
    main.innerHTML = "";
    var title = document.createElement("div");
    title.style.width = "100%";
    title.style.display = "flex";
    title.style.marginLeft = "10px";
    title.style.marginTop = "0px";
    title.style.marginBottom = "20px";
    var span = document.createElement("span");
    span.className = "material-symbols-outlined";
    span.innerText = "calendar_month";
    span.style.fontSize = "28px";
    span.style.margin = "auto 3px";
    span.classList.add("anim");
    title.append(span);
    var h2 = document.createElement("h2");
    h2.style.margin = "0px";
    h2.style.fontSize = "28px";
    h2.classList.add("anim");
    h2.innerText = end==="all"?"全期間":end.split("/")[0]+"年"+end.split("/")[1]+"月";
    title.append(h2);
    main.append(title);
    var section = document.createElement("div");
    section.style.width = "100%";
    section.style.display = "flex";
    section.id = "nsresult-section-first";
    var cards = document.createElement("div");
    cards.style.width = "100%";
    cards.style.display = "flex";
    var card = document.createElement("div");
    card.classList.add("card");
    card.style.width = "50%";
    card.style.display = "flex";
    card.style.flexWrap = "wrap";
    card.style.textAlign = "center";
    card.classList.add("anim");
    var h3 = document.createElement("h3");
    h3.style.margin = "0px";
    h3.style.width = "100%";
    h3.innerText = "レポート数";
    card.append(h3);
    var div = document.createElement("div");
    div.style.margin = "auto";
    var span = document.createElement("span");
    span.style.fontSize = "2em";
    span.style.fontWeight = "bold";
    span.innerText = report_done;
    div.append(span);
    div.append(document.createTextNode("/"+report_count));
    card.append(div);
    cards.append(card);
    var card = document.createElement("div");
    card.classList.add("card");
    card.style.width = "50%";
    card.style.display = "flex";
    card.style.flexWrap = "wrap";
    card.style.textAlign = "center";
    card.classList.add("anim");
    var h3 = document.createElement("h3");
    h3.style.margin = "0px";
    h3.style.marginTop = "0px";
    h3.style.width = "100%";
    h3.innerText = "期日まで";
    card.append(h3);
    var div = document.createElement("div");
    div.style.margin = "auto";
    var span = document.createElement("span");
    span.style.fontSize = "2em";
    span.style.fontWeight = "bold";
    var diff = "--";
    var rg = "var(--green)";
    var back = false;
    if (end !== "all") {
        diff = Math.floor((new Date(end+" 23:59:59")-now)/(1000*60*60*24));
        rg = diff<0?"var(--red)":"var(--green)";
        if (diff < 0) {
            diff = Math.abs(diff);
            back = true;
        }
    }
    span.innerText = diff;
    span.style.color = rg;
    div.append(span);
    if (end !== "all") div.append(document.createTextNode(" 日"+(back?"前":"")));
    card.append(div);
    cards.append(card);
    section.append(cards);
    var card = document.createElement("div");
    card.classList.add("card");
    card.style.width = "100%";
    card.style.display = "flex";
    card.style.flexWrap = "wrap";
    card.classList.add("anim");
    var div = document.createElement("div");
    div.style.display = "flex";
    div.style.width = "100%";
    var h3 = document.createElement("h3");
    h3.style.margin = "0px";
    h3.innerText = "完了率";
    div.append(h3);
    var rg = perc===100?"var(--green)":"var(--red)";
    var h2 = document.createElement("h2");
    h2.style.margin = "0px";
    h2.style.color = rg;
    h2.style.marginLeft = "auto";
    h2.innerText = perc+"%";
    div.append(h2);
    card.append(div);
    var div = document.createElement("div");
    div.style.overflow = "hidden";
    div.style.width = "100%";
    div.style.height = "14px";
    div.style.marginTop = "auto";
    div.style.borderRadius = "10px";
    div.style.background = "var(--gray)";
    var div2 = document.createElement("div");
    div2.style.height = "100%";
    div2.style.width = perc+"%";
    div2.style.background = rg;
    div2.style.borderRadius = "10px";
    div.append(div2);
    card.append(div);
    section.append(card);
    main.append(section);
    var section1 = document.createElement("div");
    section1.style.width = "100%";
    section1.style.display = "flex";
    section1.style.flexWrap = "wrap";
    var section2 = document.createElement("div");
    section2.style.width = "100%";
    section2.style.display = "flex";
    section2.style.flexWrap = "wrap";
    var n = 5;
    for (let i in targets){
        var r = report.reports[targets[i]];
        for (let j in r){
            for (let k in r[j]){
                var js = j.split(" ");
                var card = document.createElement("div");
                card.classList.add("card");
                card.classList.add("report-card");
                card.style.display = "flex";
                card.style.flexWrap = "wrap";
                card.classList.add("anim");
                var par = document.createElement("div");
                par.style.width = "100%";
                par.style.display = "flex";
                var h3 = document.createElement("h3");
                h3.style.margin = "0px";
                h3.style.whiteSpace = "nowrap";
                h3.style.overflow = "hidden";
                h3.style.textOverflow = "ellipsis";
                h3.innerText = js[0];
                par.append(h3);
                var exp = document.createElement("div");
                exp.style.marginLeft = "auto";
                exp.style.marginBottom = "auto";
                exp.style.background = "var(--green)";
                exp.style.color = "#fff";
                exp.style.fontSize = "0.8em";
                exp.style.padding = "2px 6px";
                exp.style.borderRadius = "5px";
                exp.style.whiteSpace = "nowrap";
                exp.innerText = Number(targets[i].split("/")[1])+"/"+Number(targets[i].split("/")[2])+"まで";
                par.append(exp);
                card.append(par);
                var h4 = document.createElement("h4");
                h4.style.margin = "0px";
                h4.style.marginBottom = "10px";
                h4.style.fontWeight = "normal";
                h4.style.fontSize = "0.8em";
                h4.style.color = "var(--gray-text)";
                h4.innerText = js[1]!==undefined?js[1].replace("(","").replace(")",""):"未受講";
                card.append(h4);
                var div = document.createElement("div");
                div.style.display = "flex";
                div.style.width = "100%";
                var h4 = document.createElement("h4");
                h4.style.margin = "0px";
                h4.style.fontWeight = "normal";
                h4.innerText = "完了率";
                div.append(h4);
                var rg = r[j][k].done === "100%"?"var(--green)":"var(--red)";
                var par = document.createElement("div");
                par.style.marginLeft = "auto";
                par.style.color = rg;
                var span1 = document.createElement("span");
                span1.style.margin = "0px 0px 0px auto";
                span1.style.fontSize = "1.5em";
                span1.style.fontWeight = "bold";
                span1.innerText = r[j][k].done.replace("%","");
                par.append(span1);
                var span2 = document.createElement("span");
                span2.style.fontSize = "1.1em";
                span2.style.marginLeft = "3px";
                span2.innerText = "%";
                par.append(span2);
                div.append(par);
                card.append(div);
                var div = document.createElement("div");
                var rg = r[j][k].done !== "100%"?"var(--red)":"var(--green)";
                div.style.overflow = "hidden";
                div.style.width = "100%";
                div.style.height = "14px";
                div.style.marginTop = "auto";
                div.style.borderRadius = "10px";
                div.style.background = "var(--gray)";
                var div2 = document.createElement("div");
                div2.style.height = "100%";
                div2.style.width = r[j][k].done;
                div2.style.background = rg;
                div2.style.borderRadius = "10px";
                div.append(div2);
                card.append(div);
                if (r[j][k].done !== "100%") {
                    section1.append(card);
                } else {
                    section2.append(card);
                }
            }
        }
    }
    if (section1.children.length !== 0) {
        var section = document.createElement("div");
        section.style.width = "100%";
        section.style.display = "flex";
        section.style.color = "var(--red)";
        section.style.marginLeft = "10px";
        section.style.marginTop = "20px";
        var span = document.createElement("span");
        span.className = "material-symbols-outlined";
        span.innerText = "block";
        span.style.fontSize = "24px";
        span.style.margin = "auto 3px";
        span.classList.add("anim");
        section.append(span);
        var h2 = document.createElement("h2");
        h2.style.margin = "0px";
        h2.style.fontSize = "24px";
        h2.innerText = "未完了";
        h2.classList.add("anim");
        section.append(h2);
        main.append(section);
        main.append(section1);
    }
    if (section2.children.length !== 0) {
        var section = document.createElement("div");
        section.style.width = "100%";
        section.style.display = "flex";
        section.style.color = "var(--green)";
        section.style.marginLeft = "10px";
        section.style.marginTop = "20px";
        var span = document.createElement("span");
        span.className = "material-symbols-outlined";
        span.innerText = "task_alt";
        span.style.fontSize = "24px";
        span.style.margin = "auto 3px";
        span.classList.add("anim");
        section.append(span);
        var h2 = document.createElement("h2");
        h2.style.margin = "0px";
        h2.style.fontSize = "24px";
        h2.classList.add("anim");
        h2.innerText = "完了済み";
        section.append(h2);
        main.append(section);
        main.append(section2);
    }
    document.querySelectorAll("#nsresult .anim").forEach(e=>{
        if (e.style === undefined) return;
        var tn = n;
        e.style.opacity = "0";
        e.style.animation = "slidein 0.25s ease "+(n*0.025)+"s forwards";
        if (e.children.length != 0) {
            Array.from(e.children).forEach(el=>{
                if (el.style === undefined) return;
                el.style.opacity = "0";
                el.style.animation = "slidein 0.25s ease "+((tn-1)*0.025)+"s forwards";
                tn++;
            });
        }
        n++;
    });
    var now_query = new URLSearchParams(location.search);
    now_query.set("studentTermId",document.getElementById("nsresult-select-year").value);
    now_query.set("mode","new");
    now_query.set("month",end);
    history.replaceState(null, "", location.pathname+"?"+now_query.toString());
}

function launch_nsresult() {
    if (document.getElementById("nsresult") !== null) return;
    var report = parse_report();
    var version = chrome.runtime.getManifest().version;
    document.body.style.overflow = "hidden";
    var div = document.createElement("div");
    div.id = "nsresult";
    div.style.position = "fixed";
    div.style.top = "0";
    div.style.left = "0";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.zIndex = "1000";
    div.style.animation = "fadein 0.5s";
    div.style.overflowY = "scroll";
    var style = document.createElement("style");
    style.innerHTML = ':root{--text:#333;--gray:#ddd;--grayb:#eee;--gray-text:#999;--back:#f5f5f5;--hback:#fff;--red:#ff3333;--green:#58C07F;--link:#264AF4;--link-visited:#6F23D0;}#nsresult{background:var(--back);color:var(--text);font-family:"Noto Sans JP", sans-serif;}#nsresult #nsresult-section-first{flex-wrap:nowrap;}#nsresult .card{margin:10px 10px;padding:20px;border-radius:10px;width:100%;background:var(--hback);box-shadow:0px 0px 25px rgba(0,0,0,0.08);}#nsresult .report-card{width:calc(100% / 3 - 60px);}#nsresult header{background:var(--hback);box-shadow:0px 0px 10px rgba(0, 0, 0, 0.2);}@media(prefers-color-scheme:dark){:root{--text:#eee;--gray:#555;--grayb:#333;--gray-text:#999;--back:#222;--hback:#323232;--green:#4ab06c;--link:#7096F8;--link-visited:#BB87FF;--logo-filter:invert(99%) sepia(3%) saturate(1245%) hue-rotate(218deg) brightness(111%) contrast(87%);}#nsresult header{box-shadow:none;}#nsresult .card{box-shadow:none;}}@media screen and (max-width: 800px){#nsresult #nsresult-section-first{flex-wrap:wrap;}#nsresult .report-card{width:calc(100% / 2 - 60px);}}@media screen and (max-width: 600px){#nsresult .report-card{width:calc(100% - 60px);}}';
    div.append(style);
    var style = document.createElement("style");
    style.innerHTML = 'a{color:var(--link);}a:visited{color:var(--link-visited);}';
    div.append(style);
    var style = document.createElement("style");
    style.innerHTML = "@keyframes fadein{from{opacity:0;}to{opacity:1;}}@keyframes fadeout{from{opacity:1;}to{opacity:0;}}@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(359deg);}}@keyframes slidein{0%{transform:translateX(10px);opacity:0;}100%{transform:translateX(0px);opacity:1;}}@keyframes slideout{0%{transform:translateX(0px);opacity:1;}100%{transform:translateX(-10px);opacity:0;}}";
    div.append(style);
    var style = document.createElement("style");
    style.innerHTML = ".switch{-webkit-appearance:none;position:relative;border-radius:10px;min-width:32px;width:32px;height:20px;border:solid 1px var(--gray);background:var(--gray);overflow:hidden;transition:all .1s ease-out}.switch:checked{background:var(--green);border:solid 1px var(--green)}.switch:before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.2);}.switch:after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:all .1s ease-out}.switch:checked:after{left:14px}";
    div.append(style);
    var header = document.createElement("header");
    header.style.height = "40px";
    header.style.width = "calc(100% - 40px)";
    header.style.padding = "10px 20px";
    header.style.display = "flex";
    header.style.position = "sticky";
    header.style.top = "0";
    header.style.left = "0";
    header.style.zIndex = "1001";
    var header_div = document.createElement("div");
    header_div.style.margin = "auto";
    header_div.style.maxWidth = "1000px";
    header_div.style.width = "100%";
    header_div.style.display = "flex";
    var logo = document.createElement("img");
    logo.src = chrome.runtime.getURL("logo.svg");
    logo.style.height = "30px";
    logo.style.margin = "auto 0px";
    logo.style.filter = "var(--logo-filter,unset)";
    header_div.append(logo);
    var right = document.createElement("div");
    right.style.margin = "auto 0px";
    right.style.marginLeft = "auto";
    right.style.display = "flex";
    var select_year = document.createElement("select");
    select_year.style.padding = "5px 10px";
    select_year.style.border = "solid 1px var(--gray)";
    select_year.style.borderRadius = "5px";
    select_year.style.marginRight = "10px";
    select_year.style.background = "var(--hback)";
    select_year.style.color = "var(--text)";
    select_year.id = "nsresult-select-year";
    document.getElementById("studentTermId").querySelectorAll("option").forEach(e=>{
        var option = document.createElement("option");
        option.value = e.value;
        option.innerText = e.innerText;
        select_year.append(option);
    });
    select_year.selectedIndex = document.getElementById("studentTermId").selectedIndex;
    select_year.onchange = function(){
        load_year();
    }
    right.append(select_year);
    var select_month = document.createElement("select");
    select_month.style.padding = "5px 10px";
    select_month.style.border = "solid 1px var(--gray)";
    select_month.style.borderRadius = "5px";
    select_month.style.marginRight = "10px";
    select_month.style.background = "var(--hback)";
    select_month.style.color = "var(--text)";
    select_month.id = "nsresult-select-month";
    gen_month_select(select_month, report);
    right.append(select_month);
    var close = document.createElement("button");
    close.style.margin = "auto 0px";
    close.style.marginRight = "10px";
    close.style.padding = "5px";
    close.style.border = "none";
    close.style.borderRadius = "5px";
    close.style.background = "#f33";
    close.style.color = "#fff";
    close.style.cursor = "pointer";
    close.style.display = "flex";
    close.classList.add("nsresult-btn");
    close.onclick = function(){
        var now_query = new URLSearchParams(location.search);
        now_query.delete("mode");
        now_query.delete("month");
        now_query.set("studentTermId",document.getElementById("studentTermId").value);
        history.replaceState(null, "", location.pathname+"?"+now_query.toString());
        var load = cload();
        load.style.animation = "fadein 0.25s";
        div.append(load);
        setTimeout(function(){
            document.querySelectorAll("link[rel=stylesheet][disabled]").forEach(e=>{e.disabled=false;});
        },250);
        setTimeout(function(){
            div.style.animation = "fadeout 0.25s";
            div.style.opacity = "0";
            setTimeout(function(){
                div.remove();
                document.body.style.overflow = "auto";
            },250);
        },1000);
    }
    var close_icon = document.createElement("div");
    close_icon.innerText = "close";
    close_icon.className = "material-symbols-outlined";
    close_icon.style.margin = "auto";
    close.append(close_icon);
    var close_text = document.createElement("div");
    close_text.innerText = "閉じる";
    close_text.style.margin = "auto";
    close_text.style.marginRight = "5px";
    close_text.style.fontSize = "15px";
    close.append(close_text);
    right.append(close);
    var share = document.createElement("button");
    share.style.margin = "auto 0px";
    share.style.padding = "5px";
    share.style.border = "solid 1px var(--gray)";
    share.style.borderRadius = "5px";
    share.style.background = "rgba(0,0,0,0)";
    share.style.color = "var(--text)";
    share.style.cursor = "pointer";
    share.style.display = "flex";
    share.classList.add("nsresult-btn");
    share.onclick = function(){
        create_share();
    }
    var share_icon = document.createElement("div");
    share_icon.innerText = "share";
    share_icon.className = "material-symbols-outlined";
    share_icon.style.margin = "auto";
    share.append(share_icon);
    right.append(share);
    header_div.append(right);
    header.append(header_div);
    div.append(header);

    var main = document.createElement("div");
    main.style.maxWidth = "800px";
    main.style.margin = "0px auto";
    main.style.padding = "20px 20px 20px 20px";
    main.style.overflowX = "hidden";
    main.id = "nsresult-main";
    div.append(main);

    var updated = document.createElement("div");
    updated.style.width = "100%";
    updated.style.height = "100%";
    updated.style.display = "flex";
    updated.style.position = "fixed";
    updated.style.top = "0";
    updated.style.left = "0";
    updated.style.zIndex = "1001";
    updated.style.background = "rgba(0,0,0,0.5)";
    updated.style.animation = "fadein 0.25s";
    var updated_modal = document.createElement("div");
    updated_modal.style.maxWidth = "800px";
    updated_modal.style.margin = "auto";
    updated_modal.style.padding = "20px";
    updated_modal.style.background = "var(--hback)";
    updated_modal.style.borderRadius = "10px";
    updated_modal.style.boxShadow = "0px 0px 25px rgba(0,0,0,0.1)";
    updated_modal.style.maxHeight = "calc(90%)";
    var header = document.createElement("div");
    header.style.width = "100%";
    header.style.display = "flex";
    header.style.marginBottom = "10px";
    var title = document.createElement("div");
    var h2 = document.createElement("h2");
    h2.style.margin = "0px";
    h2.innerText = "アップデート";
    title.append(h2);
    var span = document.createElement("span");
    span.style.fontSize = "0.8em";
    span.style.display = "block";
    span.style.color = "var(--gray-text)";
    span.innerText = version;
    title.append(span);
    header.append(title);
    var close = document.createElement("button");
    close.style.margin = "0px 0px auto auto";
    close.style.padding = "5px";
    close.style.border = "none";
    close.style.borderRadius = "5px";
    close.style.background = "#f33";
    close.style.color = "#fff";
    close.style.cursor = "pointer";
    close.style.display = "flex";
    close.classList.add("nsresult-btn");
    close.onclick = function(){
        updated.style.animation = "fadeout 0.25s";
        updated.style.opacity = "0";
        setTimeout(function(){
            updated.remove();
        },250);
    }
    updated.onclick = function(e){
        if (e.target === updated) {
            close.click();
        }
    }
    var close_icon = document.createElement("div");
    close_icon.innerText = "close";
    close_icon.className = "material-symbols-outlined";
    close_icon.style.margin = "auto";
    close.append(close_icon);
    var close_text = document.createElement("div");
    close_text.innerText = "閉じる";
    close_text.style.margin = "auto";
    close_text.style.marginRight = "5px";
    close_text.style.fontSize = "15px";
    close.append(close_text);
    header.append(close);
    updated_modal.append(header);
    var span = document.createElement("span");
    span.innerText = "N/S Resultがアップデートされました！";
    updated_modal.append(span);
    var span = document.createElement("span");
    span.style.display = "block";
    span.style.marginTop = "10px";
    span.style.fontSize = "0.9em";
    span.style.fontWeight = "bold";
    span.innerText = "更新内容";
    updated_modal.append(span);
    var update_detail = document.createElement("span");
    update_detail.style.display = "block";
    update_detail.style.color = "var(--gray-text)";
    update_detail.innerText = "取得中...";
    updated_modal.append(update_detail);
    var github_link = document.createElement("a");
    github_link.href = "https://github.com/Nuller-Team/N-S-Result/releases";
    github_link.target = "_blank";
    github_link.innerText = "GitHubで確認";
    updated_modal.append(github_link);
    updated.append(updated_modal);

    chrome.storage.local.get('lastversion', function (result) {
        if (!result.lastversion || result.lastversion != version) {
            var ajax = new XMLHttpRequest();
            ajax.open("GET", "https://api.github.com/repos/Nuller-Team/N-S-Result/releases/tags/"+version);
            ajax.onload = function() {
                var data = JSON.parse(ajax.responseText);
                if (data["body"]) {
                    var span = document.createElement("span");
                    update_detail.style.color = "var(--text)";
                    update_detail.innerText = data.body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                    github_link.href = "https://github.com/Nuller-Team/N-S-Result/releases/tag/"+version;
                    chrome.storage.local.set({"lastversion": version}, function(){});
                } else {
                    ajax.onerror();
                }
            }
            ajax.onerror = function() {
                update_detail.style.color = "var(--red)";
                update_detail.innerText = "取得に失敗しました。";
                chrome.storage.local.set({"lastversion": "invalid"}, function(){});
            }
            div.append(updated);
            ajax.send();
        }
    });

    var load = cload();
    div.append(load);
    document.body.append(div);
    setTimeout(function(){
        document.querySelectorAll("link[rel=stylesheet]").forEach(e=>{e.disabled=true;});
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
        link.onload = function(){
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap";
            link.onload = function(){
                setTimeout(function(){
                    load.style.animation = "fadeout 0.2s";
                    load.style.opacity = "0";
                    setTimeout(function(){
                        load.remove();
                    },200);
                    write_report();
                },1000);
            };
            div.append(link);
        };
        div.append(link);
    },500);
}

var btn = document.getElementById("print-btn");
if (btn !== null) {
    var newbtn = document.createElement("input");
    newbtn.type = "button";
    newbtn.className = "btn btn-default";
    newbtn.style.margin = "0px";
    newbtn.style.marginLeft = "10px";
    newbtn.style.padding = "4px 20px";
    newbtn.style.float = "right";
    newbtn.style.fontSize = "12px";
    newbtn.style.fontWeight = "300";
    newbtn.style.color = "#ffffff";
    newbtn.style.backgroundColor = "#6A88AD";
    newbtn.style.boxShadow = "0px 2px 2px rgba(0, 0, 0, 0.2)";
    newbtn.value = "N/S Resultで表示";
    newbtn.onclick = launch_nsresult;
    btn.parentNode.insertBefore(newbtn, btn);
    if (new URLSearchParams(window.location.search).get('mode') === 'new') launch_nsresult();
    if (document.getElementById("studentTermId").selectedIndex === document.getElementById("studentTermId").options.length-1) {
        chrome.storage.local.set({"result_page": location.origin+location.pathname, "reports": parse_report(), "updated": Date.now()},function(){});
    }
}