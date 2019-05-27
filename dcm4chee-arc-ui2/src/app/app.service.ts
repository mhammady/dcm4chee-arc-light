import {Injectable, OnInit, OnDestroy} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs';
import {User} from './models/user';
import * as _ from 'lodash';
import {WindowRefService} from "./helpers/window-ref.service";
import {DatePipe} from "@angular/common";
import {J4careHttpService} from "./helpers/j4care-http.service";
import {HttpClient} from "@angular/common/http";
import {j4care} from "./helpers/j4care.service";
import {DcmWebApp} from "./models/dcm-web-app";

@Injectable()
export class AppService implements OnInit, OnDestroy{
    private _user: User;
    private _global;
    subscription: Subscription;
    keycloak;
    constructor(
        public ngHttp:Http,
        public $httpClient:HttpClient
    ) {
        this.subscription = this.globalSet$.subscribe(obj => {
            this._global = obj;
        });
    }
    private _deviceName;
    private _archiveDevice;
    private _archiveDeviceName;
    get global() {
        return this._global;
    }
    serverTime:Date;
    set global(value) {
        this._global = value;
    }

    private _isRole = function(role){
        if (this.user){
            if (this.user.user === null && this.user.roles.length === 0){
                return true;
            }else{
                if (this.user.roles && this.user.roles.indexOf(role) > -1){
                    return true;
                }else{
                    return false;
                }
            }
        }else{
            if (role === 'admin'){
                return false;
            }else{
                return true;
            }
        }
    };

    get deviceName() {
        return this._deviceName;
    }

    set deviceName(value) {
        this._deviceName = value;
    }

    get archiveDevice() {
        return this._archiveDevice;
    }

    set archiveDevice(value) {
        this._archiveDevice = value;
    }
    get archiveDeviceName() {
        return this._archiveDeviceName;
    }

    set archiveDeviceName(value) {
        this._archiveDeviceName = value;
    }

// Observable string sources
    private setMessageSource = new Subject<any>();
    private setGlobalSource = new Subject<string>();
    private createPatientSource = new Subject<string>();

    // Observable string streams
    messageSet$ = this.setMessageSource.asObservable();
    globalSet$ = this.setGlobalSource.asObservable();
    createPatient$ = this.createPatientSource.asObservable();
    // Service message commands
    setMessage(msg: any) {
        console.log('in set message', msg);
        this.setMessageSource.next(msg);
    }
    showError(msg:string){
        this.setMessageSource.next({
            "title":"Error",
            "text":msg,
            "status":"error"
        })
    }
    showMsg(msg:string){
        this.setMessageSource.next({
            "title":"Info",
            "text":msg,
            "status":"info"
        })
    }
    showWarning(msg:string){
        this.setMessageSource.next({
            "title":"Warning",
            "text":msg,
            "status":"warning"
        })
    }
    setGlobal(object: any) {
        this.setGlobalSource.next(object);
    }
    updateGlobal(key:string, object:any){
        if (this.global && !this.global["key"]){
            let global = _.cloneDeep(this.global); //,...[{hl7:response}]];
            global[key] = object;
            this.setGlobal(global);
        }else{
            if (this.global && this.global[key]){
                this.global[key] = object;
            }else{
                this.setGlobal({[key]: global});
            }
        }
    }
    createPatient(patient: any){
        this.createPatientSource.next(patient);
    }

    getUserInfo(): Observable<User>{
        return this.$httpClient.get('rs/realm')
            .map(res => j4care.redirectOnAuthResponse(res))
    }
    get user(): any {
        return this._user;
    }

    set user(value: any) {
        this._user = value;
    }

    get isRole(): (role) => boolean {
        return this._isRole;
    }

    set isRole(value: (role) => boolean) {
        this._isRole = value;
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.subscription.unsubscribe();
    }
    param(filter){
        let filterMaped = Object.keys(filter).map((key) => {
            if(_.isArray(filter[key])){
                    let multiParameter = [];
                    filter[key].forEach(p=>{
                        multiParameter.push(`${key}=${p}`);
                    });
                    return multiParameter.join("&");
                    // return key + "[]=" + filter[key].join(",");
            }else{
                if (filter[key] || filter[key] === false || filter[key] === 0){
                    return key + '=' + filter[key];
                }
            }
        });
        let filterCleared = _.compact(filterMaped);
        return filterCleared.join('&');
    }

    getUniqueID(){
        let newDate = new Date(this.serverTime);
        return `${newDate.getFullYear().toString().substr(-2)}${newDate.getMonth()}${newDate.getDate()}${newDate.getHours()}${newDate.getMinutes()}${newDate.getSeconds()}`;
    }


    getMyWebApps(){
        if(_.hasIn(this.global,"myDevice")){
            return Observable.of((<DcmWebApp[]>_.get(this.global.myDevice,"dcmDevice.dcmWebApp")).map((dcmWebApp:DcmWebApp)=>{
                dcmWebApp.dcmKeycloakClientID = (<any[]>_.get(this.global.myDevice,"dcmDevice.dcmKeycloakClient")).filter(keycloakClient=>{
                    return keycloakClient.dcmKeycloakClientID === dcmWebApp.dcmKeycloakClientID;
                })[0];
                return dcmWebApp;
            }));
        }else{
            return this.getMyDevice().map(res=>{
                return _.get(res,"dcmDevice.dcmWebApp");
            })
        }
    }

    getUiConfig(){
        if(_.hasIn(this.global,"uiConfig")){
            return Observable.of(this.global.uiConfig);
        }else{
            return this.getMyDevice().map(res=>{
                return _.get(res,"dcmDevice.dcmuiConfig[0]");
            })
        }
    }
    getMyDevice(){
        if(_.hasIn(this.global,"myDevice")){
            return Observable.of(this.global.myDevice);
        }else{
            let deviceName;
            let archiveDeviceName;
            return this.$httpClient.get('./rs/devicename')
                .switchMap(res => {
                    deviceName = (_.get(res,"UIConfigurationDeviceName") || _.get(res,"dicomDeviceName"));
                    archiveDeviceName = _.get(res,"dicomDeviceName");
                    return this.$httpClient.get('./rs/devices/' + deviceName)
                })
                .map((res)=>{
                    try{
                        let global = _.cloneDeep(this.global);
                        global["uiConfig"] = _.get(res,"dcmDevice.dcmuiConfig[0]");
                        global["myDevice"] = res;
                        this.deviceName = deviceName;
                        this.archiveDeviceName = archiveDeviceName;
                        this.setGlobal(global);
                    }catch(e){
                        console.warn("Permission not found!",e);
                        this.showError("Permission not found!");
                    }
                });
        }
    }
}
