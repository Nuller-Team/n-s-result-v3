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
    console.log(report);
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
    load.style.zIndex = "1001";
    load.style.background = "var(--back)";
    load.style.display = "flex";
    var load_div = document.createElement("div");
    load_div.style.margin = "auto";
    var load_logo = document.createElement("img");
    load_logo.src = "chrome-extension://"+chrome.runtime.id+"/icon.svg";
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

function write_report(change=false,close=false) {
    if (change || close) {
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
        if (change) {
            setTimeout(function(){
                write_report();
            },500);
        }
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
                if (r[j].done === "100%") report_done++;
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
                h4.innerText = js[1]!==undefined?js[1].replace("(","").replace(")",""):"無カテゴリ";
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
                if (r[j].done !== "100%") {
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
}

function launch_nsresult() {
    if (document.getElementById("nsresult") !== null) return;
    var report = parse_report();
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
    style.innerHTML = ':root{--text:#333;--gray:#ddd;--grayb:#eee;--gray-text:#999;--back:#f5f5f5;--hback:#fff;--red:#ff3333;--green:#58C07F;}#nsresult{background:var(--back);color:var(--text);font-family:"Noto Sans JP", sans-serif;}#nsresult #nsresult-section-first{flex-wrap:nowrap;}#nsresult .card{margin:10px 10px;padding:20px;border-radius:10px;width:100%;background:var(--hback);box-shadow:0px 0px 25px rgba(0,0,0,0.08);}#nsresult .report-card{width:calc(100% / 3 - 60px);}#nsresult header{background:var(--hback);box-shadow:0px 0px 10px rgba(0, 0, 0, 0.2);}@media(prefers-color-scheme:dark){:root{--text:#eee;--gray:#555;--grayb:#333;--gray-text:#999;--back:#222;--hback:#323232;--green:#4ab06c;--logo-filter:invert(99%) sepia(3%) saturate(1245%) hue-rotate(218deg) brightness(111%) contrast(87%);}#nsresult header{box-shadow:none;}#nsresult .card{box-shadow:none;}}@media screen and (max-width: 800px){#nsresult #nsresult-section-first{flex-wrap:wrap;}#nsresult .report-card{width:calc(100% / 2 - 60px);}}@media screen and (max-width: 600px){#nsresult .report-card{width:calc(100% - 60px);}}';
    div.append(style);
    var style = document.createElement("style");
    style.innerHTML = "@keyframes fadein{from{opacity:0;}to{opacity:1;}}@keyframes fadeout{from{opacity:1;}to{opacity:0;}}@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(359deg);}}@keyframes slidein{0%{transform:translateX(10px);opacity:0;}100%{transform:translateX(0px);opacity:1;}}@keyframes slideout{0%{transform:translateX(0px);opacity:1;}100%{transform:translateX(-10px);opacity:0;}}";
    div.append(style);
    var header = document.createElement("header");
    header.style.height = "40px";
    header.style.width = "calc(100% - 40px)";
    header.style.padding = "10px 20px";
    header.style.display = "flex";
    header.style.position = "fixed";
    header.style.top = "0";
    header.style.left = "0";
    header.style.zIndex = "1001";
    var header_div = document.createElement("div");
    header_div.style.margin = "auto";
    header_div.style.maxWidth = "1000px";
    header_div.style.width = "100%";
    header_div.style.display = "flex";
    var logo = document.createElement("img");
    logo.src = "chrome-extension://"+chrome.runtime.id+"/logo.svg";
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
    close.style.padding = "5px 10px";
    close.style.border = "none";
    close.style.borderRadius = "5px";
    close.style.background = "#f33";
    close.style.color = "#fff";
    close.style.cursor = "pointer";
    close.style.display = "flex";
    close.classList.add("nsresult-btn");
    close.onclick = function(){
        write_report(close=true);
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
    header_div.append(right);
    header.append(header_div);
    div.append(header);

    var main = document.createElement("div");
    main.style.maxWidth = "800px";
    main.style.margin = "0px auto";
    main.style.padding = "calc(40px + 50px) 20px 20px 20px";
    main.style.overflowX = "hidden";
    main.id = "nsresult-main";
    div.append(main);

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