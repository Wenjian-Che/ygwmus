import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createCurationStore} from "../../backend/curation-store.mjs";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"yingge-curation-schema-"));
const catalogPath=path.join(temp,"catalog.json");
const publicPath=path.join(temp,"public.json");
const base={schema_version:2,version:1,media_assets:[{id:"media-one",version:1,inventory_ref:"candidate/a.jpg"}],exhibits:[{id:"exhibit-one",version:1,workflow_status:"draft",events:[{id:"event-one",version:1,workflow_status:"draft",media_asset_id:"media-one",sources:[{id:"source-one",version:1,url:"https://example.com"}]}]}]};
const store=createCurationStore({catalogPath,publicPath,allowedSourceHosts:["example.com"]});

for (const mutate of [
  value => value.exhibits.push(structuredClone(value.exhibits[0])),
  value => { value.exhibits[0].events[0].media_asset_id="media-missing"; },
  value => { value.media_assets[0].inventory_ref="D:/private/a.jpg"; },
  value => { value.exhibits[0].events[0].sources[0].id=""; },
]) {
  const payload=structuredClone(base); mutate(payload); fs.writeFileSync(catalogPath,JSON.stringify(payload),"utf8");
  assert.throws(()=>store.read(),error=>error.code==="CURATION_INVALID_INPUT");
}

fs.writeFileSync(catalogPath,JSON.stringify(base),"utf8");
assert.equal(store.read().exhibits[0].id,"exhibit-one");
console.log("curation schema ok");
