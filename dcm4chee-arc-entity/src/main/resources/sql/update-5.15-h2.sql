alter table patient add verification_status integer not null;
alter table patient add verification_time timestamp;
alter table patient add failed_verifications integer not null;

alter table stgcmt_result add batch_id varchar(255);
alter table stgcmt_result add msg_id varchar(255);

update patient set verification_status = 0, failed_verifications = 0;
create index UK_e7rsyrt9n2mccyv1fcd2s6ikv on patient (verification_status);
create index UK_bay8wkvwegw3pmyeypv2v93k1 on patient (verification_time);
create index UK_f718gnu5js0mdg39q6j7fklia on stgcmt_result (batch_id);
create index UK_4iih0m0ueyvaim3033di45ems on stgcmt_result (msg_id);

alter table patient alter verification_status set not null;
alter table patient alter failed_verifications set not null;