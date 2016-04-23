import 'rxjs/add/operator/map';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/forkJoin';

import 'zone.js';
import 'reflect-metadata';

import {enableProdMode} from "angular2/core";
import {Component, provide} from 'angular2/core';
import {ROUTER_DIRECTIVES,
    RouteConfig,
    ROUTER_PROVIDERS,
    LocationStrategy,
    HashLocationStrategy,
    Router} from 'angular2/router';


import {LoginComponent} from './componets/login.component';
import {AuthService} from "./services/auth.service";

import {Chat} from './componets/chat/chat.component';
import {Friends} from "./componets/friends/friends";
import {CORE_DIRECTIVES} from "angular2/common";
import {StreamComponent} from "./componets/stream/stream.component";
import {ProfileComponent} from "./componets/profile.component";
import {MeetingsComponent} from "./componets/meetings.component";
import {UnreadMessagesCount} from "./componets/chat/unreadMessagesCount";
import {ChatService} from "./services/chat.service";

declare var System: any;

@Component({
    selector: 'app',
    directives: [
        ROUTER_DIRECTIVES,
        CORE_DIRECTIVES
    ],
    template: `
<div class="navbar-fixed">
    <nav>
        <div class="nav-wrapper">
            <a href="#" class="brand-logo">
            <div><img src="favicon-white.png" class="responsive-img">Gleim.net</div>
            </a>
            <a href="#" data-activates="mobile-demo" class="button-collapse"><i class="material-icons">menu</i></a>
            
            <ul id="nav-mobile" class="right hide-on-med-and-down">
                <li><a [routerLink]="['/Stream']" >Stream</a></li>
                <li><a [routerLink]="['/MyProfile']" >Profil</a></li>
                <li><a [routerLink]="['/Chat']" >
                    Nachrichten <span *ngIf="unreadMessagesCount > 0" class="badge">{{unreadMessagesCount}}</span>
                </a></li>
                <li><a [routerLink]="['/Friends']">Freunde</a></li>
                <li><a *ngIf="!authenticated" (click)="goToLogin()"   href="#">Login</a></li>
                <li><a *ngIf="authenticated"  (click)="doLogout()"    href="#">Logout</a></li>
            </ul>
            
            <ul class="side-nav" id="mobile-demo">
                <li><a [routerLink]="['/Stream']" >Stream</a></li>
                <li><a [routerLink]="['/MyProfile']" >Me</a></li>
                <li><a [routerLink]="['/Chat']" >
                    Nachrichten <span *ngIf="unreadMessagesCount > 0" class="badge">{{unreadMessagesCount}}</span>
                </a></li>
                <li><a [routerLink]="['/Friends']">Freunde</a></li>
                <li><a *ngIf="!authenticated" (click)="goToLogin()"   href="#">Login</a></li>
                <li><a *ngIf="authenticated"  (click)="doLogout()"    href="#">Logout</a></li>
            </ul>
            
        </div>
    </nav>
</div>
<main class="mdl-layout__content">
    <router-outlet ></router-outlet>
</main>
        `
})

@RouteConfig([
    {
        path: '/',
        component: StreamComponent,
        name: 'Stream'
    },
    {
        path: '/profile',
        component: ProfileComponent,
        name: 'MyProfile'
    },
    {
        path: '/profile/:id',
        component: ProfileComponent,
        name: 'Profile'
    },
    {
        path: '/chat',
        component: Chat,
        name: 'Chat'
    },
    {
        path: '/friends',
        component: Friends,
        name: 'Friends'
    },
    {
        path: '/login',
        component: LoginComponent,
        name: 'Login'
    }
])

export class App {

    private logedIn: boolean = false;
    private sub: any = null;

    private unreadMessagesCount = 0;
    private isStartet = false;
    private intervalConversationsReload;


    constructor(private _router: Router,
                private _authService: AuthService,
                private _chatService: ChatService) {
        //enableProdMode();
    }

    ngOnInit(): void {
        this._authService.authenticated$
            .subscribe((isAuthenticated: boolean) => {
                this.logedIn = isAuthenticated;
                //console.log('isAuthenticated: ' + this.authenticated);
                if (isAuthenticated) {

                    this._chatService.currentUnreadCoutSubject.subscribe( count => {
                        this.unreadMessagesCount = count;
                    });

                    this._chatService.threads$.subscribe(updatedThreads => {
                        let lentgh = updatedThreads.length;
                    });

                    if (!this.isStartet) {
                        this.isStartet = true;
                        this.intervalConversationsReload = setInterval(() => this._chatService.loadConversations(), 5000);
                    }
                } else {
                    clearInterval(this.intervalConversationsReload);
                }
            });
    }

    get authenticated() {
        return this._authService.isAuthenticated();
    }

    goToLogin() {
        this._router.navigate(['Login']);
    }

    doLogout() {
        this._authService.doLogout();
    }
}
