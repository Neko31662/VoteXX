import Home from "../views/home/Home.vue";
import Center from "../views/center/Center.vue";
import UserAdd from "../views/user-manage/UserAdd.vue";
import UserList from "../views/user-manage/UserList.vue";
import AddVote from "../views/vote-manage/AddVote.vue";
import VoteList from "../views/vote-manage/VoteList.vue";
import MyVote from "@/views/vote-manage/MyVote.vue";
import Vote from "@/views/vote/Vote.vue";
import NotFound from "../views/notfound/NotFound.vue";

const routes = [
    {
        path: "/index",
        //此处将path设置为"/index"，则通过"url/index"访问MainBox和index指向的组件
        //而设为"index"，则通过"url/mainbox/index"访问
        component: Home
    },
    {
        path: "/center",
        component: Center,
        meta: {
            title: "Personal center"
        }
    },
    {
        path: "/vote-manage/addvote",
        component: AddVote,
        meta: {
            title: "Create/join election"
        }
    },
    {
        path: "/vote-manage/votelist",
        component: VoteList,
        meta: {
            title: "Participated elections"
        }
    },
    {
        path: "/vote-manage/myvote",
        component: MyVote,
        meta: {
            title: "created elections"
        }
    },
    {
        path: "/user-manage/adduser",
        component: UserAdd,
        meta: {
            title: "Test path 1"
        }
    },
    {
        path: "/user-manage/userlist",
        component: UserList,
        meta: {
            title: "Test path 2"
        }
    },
    {
        path: "/vote",
        component: Vote,
        meta: {
            title: "Vote"
        }
    },
    //重定向与错误处理
    {
        path: "/",
        redirect: "/index"
    },
    {
        path: "/:pathMatch(.*)*",//任意路径
        name: "NotFound",
        component: NotFound
    }
];

export default routes;