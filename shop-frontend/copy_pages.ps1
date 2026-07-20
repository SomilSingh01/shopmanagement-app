$src = "c:\Users\somil\Desktop\shopmanagernewfrontend\app"
$dest = "c:\Users\somil\Desktop\shopmanager-react\src\pages"
$layoutDest = "c:\Users\somil\Desktop\shopmanager-react\src\components\layout"

New-Item -ItemType Directory -Force -Path $dest

Copy-Item "$src\login\page.tsx" -Destination "$dest\Login.tsx" -Force
Copy-Item "$src\signup\page.tsx" -Destination "$dest\Signup.tsx" -Force
Copy-Item "$src\app\page.tsx" -Destination "$dest\Dashboard.tsx" -Force
Copy-Item "$src\app\customers\page.tsx" -Destination "$dest\Customers.tsx" -Force
Copy-Item "$src\app\inventory\page.tsx" -Destination "$dest\Inventory.tsx" -Force
Copy-Item "$src\app\notifications\page.tsx" -Destination "$dest\Notifications.tsx" -Force
Copy-Item "$src\app\orders\page.tsx" -Destination "$dest\Orders.tsx" -Force
Copy-Item "$src\app\settings\page.tsx" -Destination "$dest\Settings.tsx" -Force
Copy-Item "$src\app\layout.tsx" -Destination "$layoutDest\AppLayout.tsx" -Force
