create table metadata (pk int8 not null, digest varchar(255), object_size int8 not null, status int4 not null, storage_id varchar(255) not null, storage_path varchar(255) not null, primary key (pk));

alter table series add metadata_update_time timestamp, add metadata_fk int8, add purge_insts_time timestamp, add purged_insts int4;
update series set purged_insts = 0;
alter table series alter purged_insts set not null;
alter table series add constraint FK_pu4p7k1o9hleuk9rmxvw2ybj6 foreign key (metadata_fk) references metadata;

create index UK_f7c9hmq8pfypohkgkp5vkbhxp on metadata (storage_id, status);
create index UK_hwkcpd7yv0nca7o918wm4bn69 on series (metadata_update_time);
create index UK_jbupa0ljf4s5wm5h2gaf0im2d on series (purge_insts_time);
create index UK_mv0dh0joo28yk4f33buesb86p on series (purged_insts);
create index FK_pu4p7k1o9hleuk9rmxvw2ybj6 on series (metadata_fk) ;

create sequence metadata_pk_seq;
