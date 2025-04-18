import { router } from "../tsimports"

class GlobalActions {
    static AddToVmPool(vm){
        global.vmPool[vm._name] = vm
    }

    static UpdateCurrentPageName(){
        global.currentPageName = router.getState().name
    }

    static ClearCurrentVmSrcClass(){
        global.vmPool[global.currentPageName].scrclass = ""
    }
}

function runVmPoolGC(){
    for(var name in global.vmPool){
        if(global.vmPool[name]){
            if(global.vmPool[name].$valid){
                return
            }
        }

        console.log("[ui.VmPoolGC] page named", name, " has been already destroyed.")
        delete global.vmPool[name]
    }
}

export function Init(){
    global.vmPool = {}
    global.currentPageName = ""
    console.log("[ui.InitPage] inited.")

    setInterval(() => {
        runVmPoolGC()
    }, 10000)
}

export function InitPage(vm){
    GlobalActions.UpdateCurrentPageName()
    GlobalActions.AddToVmPool(vm)
    GlobalActions.ClearCurrentVmSrcClass()
    console.log("[ui.InitPage] vm set successed. name=", global.currentPageName)
}

export function OnBackPressTriggered(){
    GlobalActions.UpdateCurrentPageName()
    global.vmPool[global.currentPageName].scrclass = "scroll-backanim"
    setTimeout(() => {
        global.vmPool[global.currentPageName].scrclass = "scroll-back-hidden"
        GlobalActions.ClearCurrentVmSrcClass()
        router.back()

        var pageStack = router.getPages()
        var lastPageName = pageStack[pageStack.length - 2].name
        console.log("lastpage=", lastPageName, "currentPage=", global.currentPageName)
        global.vmPool[lastPageName].scrclass = ""
        global.vmPool[lastPageName].scrclass = "scroll-frombackanim"
    }, 150)
}