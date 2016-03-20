import {Component} from 'angular2/core';
import {OnInit} from "angular2/core";
import {AfterViewChecked} from "angular2/core";
import {OnDestroy} from "angular2/core";
import {RouterLink} from "angular2/router";
import {Inject} from "angular2/core";
import {RouteParams,RouteData} from 'angular2/router';
import {ROUTER_DIRECTIVES} from 'angular2/router';
import {Router} from "angular2/router";

import {Observable} from 'rxjs/Observable';
import {Subject } from 'rxjs/Subject';

import {ProfileService, User,ProfileFriend,Messages, Timeline} from "../services/profile.service";
import {ChatService} from "../services/chat.service";
import {FriendsService} from "../services/friendsService";
import {TimelineService} from "../services/timeline.service";
import {Post} from "../services/timeline.service";
import {TimeLinePostComponent} from "./stream/post.component";
import {ProtectedDirective} from "../directives/protected.directive";
import {AuthHttp} from "angular2-jwt/angular2-jwt";
import {AuthService} from "../services/auth.service";
import {FormatedDateFromStringPipe} from "../util/dateFormat.pipe";

@Component({
    selector: 'Profile',
    directives: [
        TimeLinePostComponent,
        ProtectedDirective
    ],
    providers:[
        TimelineService
    ],
    pipes: [FormatedDateFromStringPipe],
    template: `
        <div protected>

<div class="titelImage" style="background-image:url('assets/{{user.titlePicture}}')">

    <img *ngIf="user.username" class="thumbnail profilimage" src="assets/{{user.avatar}}"
                 alt="...">

</div>

    <div class="profile_name_box card">
        <div class="mdl-card__supporting-text">
        <h4>
            {{user.givenName}} {{user.username}}
        </h4>
        <div class="row">
            <button *ngIf="addFriendButton && !isMe" type="button"
                    class="btn btn-default btn-sm pull-right"
                    (click)="addAsFriend()">
                <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>
                Freund hinzufügen
            </button>

            <button *ngIf="!isMe" type="button"
                    class="btn btn-default btn-sm pull-right"
                    (click)="sendMessage()">
                <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
                Nachricht senden
            </button>
        </div>
        </div>
    </div>


<div class="row">
    <div class="col s3">
        <div class="card profile_info">
            <div class="card-content">
                <h5>Geburtsdatum:</h5>
                <p>{{user.birthdate | formatedDateFromString}}
                <h5>Info:</h5>
                <p>{{user.description}}</p>


                <h5>Freunde:</h5>
                <div class="col-md-4 friendImage" *ngFor="#Friend of friends">
                    <div class="mdl-color-text--grey-700 posting_header meta">
                        <a class="" href="#/profile/{{Friend.username}}" role="button">
                            <img src="img/profilimages/64x64/{{Friend.avatar}}.png" class="round_avatar">
                        </a>
                        <div class="comment__author">
                            <strong>{{Friend.givenName}}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col s9">
        <div class="card stream_form">
            <div class="card-content">
            <form class="row">
                <span class="input-field col s10">
                    <input #newPosting
                           (keyup.enter)="postNewPosting(newPosting.value); newPosting.value=''"
                           type="text" class="mdl-textfield__input">
                    <label for="comment">
                        Was bewegt Sie?
                    </label>
                </span>
                <span class="input-group-btn col s1">
                    <button class="waves-effect waves-light btn send_Button"
                        (click)="postNewPosting(newPosting.value); newPosting.value='' ">
                        <i class="large material-icons">send</i>
                    </button>
                 </span>
            </form>
            </div>
        </div>

        <div *ngIf="timelineAvailable">
            <div  class="posting" *ngFor="#posting of posts">
                <posting [posting]="posting"></posting>
            </div>
        </div>

        <div *ngIf="!timelineAvailable" class="posting">
                 <div  class="mdl-card mdl-shadow--4dp mdl-cell mdl-cell--12-col stream_form">

                    <div class="spinner">
                        <div class="bounce1"></div>
                        <div class="bounce2"></div>
                        <div class="bounce3"></div>
                    </div>
                 </div>
        </div>

    </div>
</div>

<hr>

</div>
`
})

export class ProfileComponent implements OnInit, OnDestroy{

    friends:ProfileFriend[];

    addFriendButton=true;
    router:Router
    interval

    isMe = false;
    timelineAvailable:boolean = false;
    userId:string;
    private user = new User()
    private posts:Array<Post>;

    constructor(
        private _router: Router,
        private _routeParams:RouteParams,
        private _profileService: ProfileService,
        private _authService:AuthService, private _timelineService:TimelineService ) {

        this.posts = new Array<Post>();
        this.userId = this._routeParams.get('id');

        if(this.userId == null){
            this.isMe = true;
            this.userId = this._authService.getUserId();
        }else if(this.userId == this._authService.getUserId()){
            this.isMe = true;
        }else {
            this.isMe = false;
        }

    }

    ngOnInit(): void {
        this._profileService.user$
            .subscribe((user: User) => {
                    this.user = user;
                    this.loadTimeline(this.user.timeline);
                    // this.interval = setInterval(() => this.loadTimeline(this.user.timeline), 2000 );
                }
            );
        //

        this.loadProfilInfos();



        //this._profileService.getUserWithID(this.userId);

        this._timelineService.posts$
            .subscribe(posts => {
                    this.posts = posts;
                    this.timelineAvailable=true;
                }
            );
    }

    getUserForId(userId:string):string{
        return "Schiller";
    }


    ngOnDestroy() {
        clearInterval(this.interval);
    }

    loadProfilInfos(){
        if(this._authService.isAuthenticated()){
            this._profileService.loadProfilInfosWithID(this.userId);
        }
    }


    loadTimeline(timeLineId:string){
        if(this._authService.isAuthenticated()){
            this._timelineService.load(timeLineId);
        }
    }


    postNewPosting(content:string){
        if(this._authService){
            this._timelineService.postNewPosting(content);
        }
    }

    commentOnPosting(content:string, postId:string){
        if(this._authService.isAuthenticated()){
            //this._profileService.commentOnPosting(content, postId)
            //    .subscribe(
            //        response => {
            //            this.loadTimeline();
            //        },
            //        error => { console.log(error);}
            //    );
        }
    }

    addAsFriend(){
        if(this._authService.isAuthenticated()) {
            //this._friendsService.requestFriendship(this.userId)
            //    .subscribe(
            //        response => {
            //
            //            this.addFriendButton = false;
            //        },
            //        error => { console.log(error.message);}
            //    )
        }
    }

    sendMessage(){
        if(this._authService.isAuthenticated()) {
            //this._chatService.newConversation(this.userId)
            //    .subscribe(
            //        response => {
            //            console.log(response);
            //            this._router.navigateByUrl('/chat');
            //        },
            //        error => { console.log(error.message);}
            //    )
        }
    }
}
