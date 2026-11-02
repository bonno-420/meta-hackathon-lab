import { readFileSync, writeFileSync } from "node:fs";

const paths = [
  "C:/Users/norik/projects/meta-hackathon-lab/loops/loop-015/previews/topic-A-EN1-gen-003-complete.html",
  "C:/Users/norik/projects/meta-hackathon-lab/loops/loop-015/previews/topic-B-EN1-gen-002-complete.html",
];

for (const p of paths) {
  let h = readFileSync(p, "utf8");
  if (h.includes('id="lp-memo"')) {
    console.log(p.split("/").pop() + ": already has memo form, skipping");
    continue;
  }
  const block = `
<section id="lp-memo" aria-labelledby="lp-memo-h2">
<h2 id="lp-memo-h2">Memo <span class="jp">\u3053\u306eLP\u3078\u306e\u30E1\u30E2\uFF08\u30D6\u30E9\u30A6\u30B6\u4FDD\u5B58\uFF09</span></h2>
<p class="note">\u3053\u306E\u30D5\u30A9\u30FC\u30E0\u306F\u3053\u306E\u30DA\u30FC\u30B8\u5185\u3067\u5B8C\u7D50\u3057\u307E\u3059\u3002\u5165\u529B\u306F\u30D6\u30E9\u30A6\u30B6\u306E <code>localStorage</code> \u306B\u81EA\u52D5\u4FDD\u5B58\u3055\u308C\u3001\u30EA\u30ED\u30FC\u30C9\u3057\u3066\u3082\u6B8B\u308A\u307E\u3059\u3002\u9001\u4FE1\u5148\u30B5\u30FC\u30D0\u30FC\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u300C\u30B3\u30D4\u30FC\u300D\u300C\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u300D\u3067 reflection-memos \u3078\u8EE2\u8A18\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p>
<div id="memo-app" data-storage-key=""></div>
<p class="note" style="margin-top:10px">\u904B\u7528: \u30B3\u30D4\u30FC\u3057\u305F\u30C6\u30AD\u30B9\u30C8\u3092 <code>loops/loop-015/reflection-memos/</code> \u306B\u624B\u52D5\u4FDD\u5B58\u3059\u308B\u304B\u3001\u7D71\u62EC(Muse)\u306B\u8CBC\u308A\u4ED8\u3051\u3066\u53CD\u6620\u30E1\u30E2\u5316\u3057\u307E\u3059\u3002K1\u301C K5\u4EE5\u5916\u306E\u505C\u6B62\u306F\u3057\u307E\u305B\u3093\u3002</p>
</section>
<script>
(function(){
  var section=document.getElementById('lp-memo');
  if(!section) return;
  var key=(document.title||location.pathname).replace(/[^A-Za-z0-9_-]+/g,'_').slice(0,60) || 'lp-memo';
  key='lp-memo:'+key+':'+location.pathname.split('/').pop();
  var app=document.getElementById('memo-app');
  var fields=[
    {id:'overall', label:'\u5168\u4F53\u306E\u5370\u8C61\uFF081\u6587\u3067\uFF09', ph:'\u4F8B: \u660E\u308B\u3044\u304C\u6761\u4EF6\u304C\u57CB\u3082\u308C\u3066\u3044\u308B / \u5B50\u80B2\u3066\u914D\u616E\u306F\u4F1D\u308F\u308B\u304C\u2026'},
    {id:'readability', label:'\u8AAD\u307F\u3084\u3059\u3055\u30FB\u6D41\u308C', ph:'\u4F8B: Pay\u2192Support \u306E\u9806\u304C\u81EA\u7136 / \u6CE8\u8A18\u304C\u9577\u3044'},
    {id:'facts', label:'\u4E8B\u5B9F\u306E\u6271\u3044\u30FB\u6CE8\u8A18', ph:'\u4F8B: L07\u306E\u4E0A\u9650\u304C\u672C\u6587\u3068\u96E2\u308C\u3066\u3044\u308B / \u672A\u8A18\u8F09\u306E\u66F8\u304D\u65B9\u304C\u2026'},
    {id:'visual', label:'\u898B\u305F\u76EE\u30FB\u5199\u771F\u30FB\u8272', ph:'\u4F8B: \u30D2\u30FC\u30ED\u30FC\u304C\u6697\u3044 / \u30AB\u30FC\u30C94\u679A\u306F\u591A\u3044'},
    {id:'cta', label:'\u5FDC\u52DF\u524D\u30C1\u30A7\u30C3\u30AF\u30FBCTA', ph:'\u4F8B: \u30C1\u30A7\u30C3\u30AF4\u9805\u76EE\u306E\u8A00\u3044\u56DE\u3057 / \u30DC\u30BF\u30F3\u6587\u8A00'},
    {id:'other', label:'\u305D\u306E\u4ED6 / \u6B21\u306B\u76F4\u3057\u305F\u30441\u70B9', ph:'\u81EA\u7531\u8A18\u8FF0'},
  ];
  var css=document.createElement('style');
  css.textContent='#lp-memo{border:2px dashed #bbb;border-radius:14px;padding:16px;background:#fff}#lp-memo h2{color:#333}#memo-app label{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}#memo-app textarea{width:100%;min-height:72px;padding:10px 12px;border:1px solid #ccc;border-radius:10px;font:14px/1.6 system-ui,sans-serif;box-sizing:border-box}#memo-app textarea:focus{outline:2px solid #6a9bff;border-color:#6a9bff}#memo-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}#memo-actions button{font:13px/1 system-ui,sans-serif;padding:10px 14px;border-radius:999px;border:1px solid #ccc;background:#fff;cursor:pointer;color:#222}#memo-actions button.primary{background:#1a3c5e;color:#fff;border-color:#1a3c5e}#memo-actions button.danger{color:#a00;border-color:#e99}#memo-status{font-size:12px;color:#666;margin-top:8px;min-height:1.2em}';
  document.head.appendChild(css);
  function load(){ try{ var r=localStorage.getItem(key); return r?JSON.parse(r):{}; }catch(e){ return {}; } }
  function save(data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
  var data=load();
  fields.forEach(function(f){
    var lab=document.createElement('label');
    lab.setAttribute('for','memo-'+f.id);
    lab.textContent=f.label;
    var ta=document.createElement('textarea');
    ta.id='memo-'+f.id;
    ta.placeholder=f.ph;
    ta.value=data[f.id]||'';
    ta.addEventListener('input', function(){
      data[f.id]=ta.value;
      save(data);
      statusEl.textContent='\\u4FDD\\u5B58\\u6E08\\u307F ('+new Date().toLocaleTimeString()+')';
    });
    app.appendChild(lab);
    app.appendChild(ta);
  });
  var actions=document.createElement('div');
  actions.id='memo-actions';
  var statusEl=document.createElement('div');
  statusEl.id='memo-status';
  statusEl.setAttribute('role','status');
  statusEl.setAttribute('aria-live','polite');
  function toText(){
    var lines=[];
    lines.push('# LP memo '+new Date().toISOString().slice(0,10));
    lines.push('# page: '+location.pathname.split('/').pop());
    lines.push('# title: '+document.title);
    lines.push('');
    fields.forEach(function(f){
      lines.push('## '+f.label);
      lines.push((data[f.id]||'').trim() || '(\\u672A\\u8A18\\u5165)');
      lines.push('');
    });
    return lines.join('\\n');
  }
  var copyBtn=document.createElement('button');
  copyBtn.type='button'; copyBtn.className='primary'; copyBtn.textContent='\\u30B3\\u30D4\\u30FC';
  copyBtn.addEventListener('click', function(){
    var t=toText();
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ statusEl.textContent='\\u30B3\\u30D4\\u30FC\\u3057\\u307E\\u3057\\u305F'; }, function(){ fallbackCopy(t); }); } else { fallbackCopy(t); }
  });
  function fallbackCopy(t){
    var ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); statusEl.textContent='\\u30B3\\u30D4\\u30FC\\u3057\\u307E\\u3057\\u305F'; }catch(e){ statusEl.textContent='\\u30B3\\u30D4\\u30FC\\u306F\\u624B\\u52D5\\u3067\\u9078\\u629E\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044'; }
    ta.remove();
  }
  var dlBtn=document.createElement('button');
  dlBtn.type='button'; dlBtn.textContent='\\u30C6\\u30AD\\u30B9\\u30C8\\u3067\\u30C0\\u30A6\\u30F3\\u30ED\\u30FC\\u30C9';
  dlBtn.addEventListener('click', function(){
    var t=toText();
    var blob=new Blob([t], {type:'text/plain;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download='lp-memo-'+(location.pathname.split('/').pop().replace(/\\.html.*/,'')||'memo')+'.md';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    statusEl.textContent='\\u30C0\\u30A6\\u30F3\\u30ED\\u30FC\\u30C9\\u3057\\u307E\\u3057\\u305F \\u2192 reflection-memos \\u3078\\u914D\\u7F6E\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044';
  });
  var clearBtn=document.createElement('button');
  clearBtn.type='button'; clearBtn.className='danger'; clearBtn.textContent='\\u30AF\\u30EA\\u30A2';
  clearBtn.addEventListener('click', function(){
    if(!confirm('\\u3053\\u306E\\u30DA\\u30FC\\u30B8\\u306E\\u30E1\\u30E2\\u3092\\u3059\\u3079\\u3066\\u6D88\\u53BB\\u3057\\u307E\\u3059\\u3002\\u3088\\u308D\\u3057\\u3044\\u3067\\u3059\\u304B\\uFF1F')) return;
    data={}; save(data);
    app.querySelectorAll('textarea').forEach(function(t){ t.value=''; });
    statusEl.textContent='\\u30AF\\u30EA\\u30A2\\u3057\\u307E\\u3057\\u305F';
  });
  actions.appendChild(copyBtn);
  actions.appendChild(dlBtn);
  actions.appendChild(clearBtn);
  app.appendChild(actions);
  app.appendChild(statusEl);
  if(Object.keys(data).some(function(k){ return (data[k]||'').trim(); })) statusEl.textContent='\\u524D\\u56DE\\u306E\\u5165\\u529B\\u3092\\u5FA9\\u5143\\u3057\\u307E\\u3057\\u305F';
})();
</script>
`;
  h = h.replace("</div>\r\n</body>\r\n</html>\r\n", block + "\n</div>\n</body>\n</html>\n");
  writeFileSync(p, h, "utf8");
  console.log(p.split("/").pop() + ": injected, " + h.length + " bytes");
}
