import { supabaseAdmin } from "../../lib/supabaseAdmin"

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

const {data,error}=await supabaseAdmin
.from("favoritos")
.select("*")
.eq("user_id",user_id)

if(error) throw error

return res.json(data)
}

}

if(req.method==="POST"){

const {user_id,listing_id}=req.body

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
