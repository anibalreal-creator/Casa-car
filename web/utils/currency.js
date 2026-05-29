
export const rates = {
USD:1,
EUR:0.92,
BRL:5,
CNY:7.2,
ARS:900
}

export function convert(price,from,to){

const usd = price / rates[from]

return (usd * rates[to]).toFixed(2)

}
