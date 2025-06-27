import { prismaClient } from "@/app/lib/db";
import NextAuth from "next-auth";
import  CredentialsProvider  from "next-auth/providers/credentials";

const handler = NextAuth({
    providers:[
        CredentialsProvider({
            name: "SCMT Log In",
            credentials:{
                email : {label: 'email', type: 'text', placeholder: 'Email'},
                password : {label: 'password', type: 'text', placeholder: 'password'}
            },
            async authorize(credentials: any) {
                console.log(credentials);
                return null
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,

})

export {handler as GET, handler as POST}