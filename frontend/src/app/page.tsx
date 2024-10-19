import Graph from "@/components/graph";
import { NodeEditorSidebarComponent } from "@/components/node-editor-sidebar";
import { MenuBarComponent } from "@/components/menu-bar";

export default function Home() {
    return (
        <div className="relative h-screen">
            {/* Menu bar at the top */}
            <MenuBarComponent />

            {/* Sidebar and Graph below the menu bar */}
            <div className="flex flex-1">
                {/* Sidebar on the left, starting below the menu bar */}
                <NodeEditorSidebarComponent />

                {/* Graph component fills the remaining space */}
                <div className="flex-1 relative z-10">
                    <Graph />
                </div>
            </div>
        </div>
    );
}
