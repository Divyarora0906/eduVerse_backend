const {Schema,model} = require("mongoose")

const UserSchema = new Schema({
    firstname:{type:String,required:true},
    lastname:{type:String,required:true},
    username:{type:String,required:true},
    password:{type:String,required:true},
    email:{type:String,required:true},
    phone:{type:Number,required:true,unique:true},
    courseIds: [{
        type: Number,
      }],
    courseName:{type:String}
   
},{
    timestamps:true
})

const UserModel = model("Edu",UserSchema);
module.exports=UserModel