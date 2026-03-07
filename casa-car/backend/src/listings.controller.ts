import { Controller, Get, Param } from '@nestjs/common';

@Controller('listings')
export class ListingsController {
  @Get()
  findAll(){
    return [
      { id:'1', title:'Casa ejemplo', price:100000, photos:[] },
      { id:'2', title:'Auto ejemplo', price:8000, photos:[] }
    ];
  }

  @Get(':id')
  findOne(@Param('id') id:string){
    return { id, title:`Anuncio ${id}`, price:100+Number(id), photos:[] };
  }
}
