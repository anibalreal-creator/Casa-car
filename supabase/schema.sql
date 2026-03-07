create table if not exists listings (
  id serial primary key,
  titulo text not null,
  descripcion text,
  moneda text not null default 'USD',
  precio numeric not null check (precio > 0),
  created_at timestamp default now()
);
