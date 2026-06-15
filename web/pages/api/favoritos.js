import { supabaseAdmin } from "../../lib/supabaseAdmin"
import { getServerUser } from "../../lib/auth"
import { isAdmin } from "../../lib/permissions"

export default async function handler(req, res) {

try{

if(req.method==="GET"){

const {listing_id,user_id}=req.query

if(listing_id){

const {data,error}=await supabaseAdmin
.from("favoritos")
.select("*")
.eq("listing_id",listing_id)

if(error) throw error

return res.json({count:data.length})
}

if(user_id){
const user = await getServerUser(req)
if(!user) return res.status(401).json({error:"No autorizado"})
if(String(user.id)!==String(user_id) && !(await isAdmin(user.id,user.email))){
return res.status(403).json({error:"No autorizado"})
}

const {data,error}=await supabaseAdmin
.from("favoritos")
.select("*")
.eq("user_id",user_id)

if(error) throw error

return res.json(data)
}

}

if(req.method==="POST"){

const user = await getServerUser(req)
if(!user) return res.status(401).json({error:"No autorizado"})
const {listing_id}=req.body
const user_id=user.id

const {data:existing}=await supabaseAdmin
.from("favoritos")
.select("*")
.eq("user_id",user_id)
.eq("listing_id",listing_id)

if(existing.length>0){

await supabaseAdmin
.from("favoritos")
.delete()
.eq("user_id",user_id)
.eq("listing_id",listing_id)

return res.json({action:"removed"})
}

await supabaseAdmin
.from("favoritos")
.insert({
user_id,
listing_id
})

return res.json({action:"added"})
}

}catch(err){

res.status(500).json({error:err.message})

}

}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
