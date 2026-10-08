// Implement Modules in NodeJS CO2
// 6 Develop mini application using Express and NodeJS

// console.log("current directory",__dirname);
// console.log("current file",__filename)

global.name = "Windows"

function WorstOs(){
    console.log(`Worst Os is: ${global.name}`);
}
WorstOs();

function ProcDetails(){
    console.log(`Node version: ${process.version}`);
    // console.log(`current working directory: ${process.cwd()}`);
    console.log(`operating system: ${process.platform}`);
}
ProcDetails();

// limitation

function glob_func(){
    global.config = {
        name : "harsha",
        roll: "75"
    }
}

console.log(global.config.roll)