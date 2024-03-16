import Home from "../views/home/Home.vue";
import Center from "../views/center/Center.vue";
import UserAdd from "../views/user-manage/UserAdd.vue";
import UserList from "../views/user-manage/UserList.vue";
import NewsAdd from "../views/news-manage/NewsAdd.vue";
import NewsList from "../views/news-manage/NewsList.vue";
import ProductAdd from "../views/product-manage/ProductAdd.vue";
import ProductList from "../views/product-manage/ProductList.vue";
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
        component: Center
    },
    {
        path: "/news-manage/addnews",
        component: NewsAdd
    },
    {
        path: "/news-manage/newslist",
        component: NewsList
    },
    {
        path: "/user-manage/adduser",
        component: UserAdd
    },
    {
        path: "/user-manage/userlist",
        component: UserList
    },
    {
        path: "/product-manage/addproduct",
        component: ProductAdd
    },
    {
        path: "/product-manage/productlist",
        component: ProductList
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