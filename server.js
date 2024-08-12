/*********************************************************************************
*  WEB700 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Heet zadafiya Student ID: 140255233 Date: 11/08/2024
*
********************************************************************************/ 

var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
const collegeData = require('./modules/collegeData');
const path = require('path');
const exphbs = require('express-handlebars')

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: { 
        //custom helper function to fix navbar
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + 
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }           
    }
}));
app.set('view engine', '.hbs');

//add activeRoute property to fix nav bar
app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));    
    next();
});

// setup a 'route' to listen on the default url path
app.get("/", (req, res) => {
    res.render('home', {layout: 'main'});
});

app.get("/about", (req, res) => {
    res.render('about', {layout: 'main'});
});

app.get("/htmlDemo", (req, res) => {
    res.render('htmlDemo', {layout: 'main'});
});

app.get("/addStudent", (req, res) => {
    collegeData.getCourses()
    .then((courses) => {
        res.render("addStudent", {data: courses});
    })
    .catch((err) => {
        res.render("addStudent", {courses: []}); 
    });
});

app.post("/students/add", (req, res) => {
    collegeData.addStudent(req.body)
    .then(() => {
        res.redirect("/students");
    })
    .catch((error) => {
        console.log(error.message)
        res.status(400).send(`<script>alert('Something Went Wrong'); window.location.href = '/addStudent';</script>`);
    })
})

app.get("/students", (req, res) => {
    if (req.query && req.query.course) {
        collegeData.getStudentsByCourse(req.query.course)
        .then((students) => {
            if(students.length > 0) {
                res.render("students", {data: students});
            } else {
                res.render("students",{ message: "No results" });
            }
        })
        .catch((err) => {
            console.log(err.message);
            res.render("students", {message: "No Results"});
        })
    }
    else {
        collegeData.getAllStudents()
        .then((students) => {
            if(students.length > 0) {
                res.render("students", {data: students});
            } else {
                res.render("students",{ message: "No results" });
            }
        })
        .catch((err) => {
            console.log(err.message);
            res.render("students", {message: "No Results"});
        })
    }
});

app.get("/students/:id", (req, res) => {
    let viewData = {};
    collegeData.getStudentByNum(req.params.id).then((data) => {
        if (data) {
            viewData.student = data; //store student data in the "viewData" object as "student"
        } else {
            viewData.student = null; // set student to null if none were returned
        }
    }).catch(() => {
        viewData.student = null; // set student to null if there was an error 
    }).then(() => collegeData.getCourses())
    .then((data) => {
        viewData.courses = data; // store course data in the "viewData" object as "courses"
        // loop through viewData.courses and once we have found the courseId that matches
        // the student's "course" value, add a "selected" property to the matching 
        // viewData.courses object

        for (let i = 0; i < viewData.courses.length; i++) {
            if (viewData.courses[i].courseId == viewData.student.course) {
                viewData.courses[i].selected = true;
            }
        }

    }).catch(() => {
        viewData.courses = []; // set courses to empty if there was an error
    }).then(() => {
        if (viewData.student == null) { // if no student - return an error
            res.status(404).send("Student Not Found");
        } else {
            res.render("student", { viewData: viewData }); // render the "student" view
        }
    });
});

app.post("/student/update", (req, res) => {
    collegeData.updateStudent(req.body)
    .then(() => {
        res.redirect("/students");
    })
    .catch((error) => {
        console.log(error);
        res.status(400).send(`<script>alert('Something Went Wrong');</script>`);
    })
});

app.get("/student/delete/:id", (req, res) => {
    collegeData.deleteStudent(req.params.id)
    .then((student) => {
        res.redirect("/students");
    })
    .catch((err) => {
        res.status(500).send(`<script>alert('Unable to Remove Student / Student not found');</script>`);
    })
});

app.get("/addCourse", (req, res) => {
    res.render('addCourse', {layout: 'main'});
});

app.post("/course/add", (req, res) => {
    collegeData.addCourse(req.body)
    .then(() => {
        res.redirect("/courses");
    })
    .catch((error) => {
        console.log(error.message)
        res.status(400).send(`<script>alert('Something Went Wrong'); window.location.href = '/addCourse';</script>`);
    })
})

app.get("/courses", (req, res) => {
    collegeData.getCourses()
    .then((courses) => {
        if(courses.length > 0) {
            res.render("courses", {data: courses});
        } else {
            res.render("courses",{ message: "No results" });
        }
    })
    .catch((err) => {
        console.log(err.message);
        res.render("courses", {message: "No Results"});
    })
});

app.get("/course/:id", (req, res) => {
    collegeData.getCourseById(req.params.id)
    .then((course) => {
        res.render("course", { data: course }); 
    })
    .catch((err) => {
        res.render("course", {message: "No Results"});
    })
});

app.post("/course/update", (req, res) => {
    collegeData.updateCourse(req.body)
    .then(() => {
        res.redirect("/courses");
    })
    .catch((error) => {
        console.log(error);
        res.status(400).send(`<script>alert('Something Went Wrong');</script>`);
    })
});

app.get("/course/delete/:id", (req, res) => {
    collegeData.deleteCourse(req.params.id)
    .then((course) => {
        res.redirect("/courses");
    })
    .catch((err) => {
        res.status(500).send(`<script>alert('Unable to Remove Course / Course not found');</script>`);
    })
});

app.all('*',(req, res) => {
    res.status(404).json({message:"Page Not Found"});
});
// setup http server to listen on HTTP_PORT
collegeData.initialize()
.then ((message) => {
    console.log(message)
    app.listen(HTTP_PORT, ()=>{console.log("server listening on port: " + HTTP_PORT)});
}).catch((err) => {
    console.log(err.message);
    console.log("Failed to fetch data from disk")
})

module.exports = app;