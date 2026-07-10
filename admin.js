const SUPABASE_URL = "https://fgmvmbjnoyagnpygcbky.supabase.co";
const SUPABASE_KEY = "sb_publishable_pePa2xjccUZB6xpJJ5fn6h";

const month = document.getElementById("month");
const attendanceList = document.getElementById("attendanceList");

month.value = new Date().toISOString().slice(0,7);

async function loadAttendanceStatus(){

    attendanceList.innerHTML = "読込中...";

    const headers = {
        apikey: SUPABASE_KEY,
        Authorization:`Bearer ${SUPABASE_KEY}`
    };

    //-----------------------------------
    // 社員一覧
    //-----------------------------------

    const employeeRes = await fetch(
        `${SUPABASE_URL}/rest/v1/employees?select=id,name,department,active&active=eq.true&order=department.asc,id.asc`,
        {headers}
    );

    const employees = await employeeRes.json();

    //-----------------------------------
    // 出勤簿
    //-----------------------------------

    const first = month.value + "-01";

    const nextDate = new Date(month.value + "-01");
    nextDate.setMonth(nextDate.getMonth()+1);

    const next =
        nextDate.getFullYear() +
        "-" +
        String(nextDate.getMonth()+1).padStart(2,"0") +
        "-01";

    const attendanceRes = await fetch(
        `${SUPABASE_URL}/rest/v1/attendance?select=employee_id,status&work_date=gte.${first}&work_date=lt.${next}`,
        {headers}
    );

    const attendance = await attendanceRes.json();

    //-----------------------------------
    // 提出済社員
    //-----------------------------------

    const submitted = new Set();

    attendance.forEach(a=>{

        if(a.status==="submitted" || a.status==="locked"){

            submitted.add(a.employee_id);

        }

    });

    //-----------------------------------
    // 表示
    //-----------------------------------

    attendanceList.innerHTML="";

    let currentDepartment="";

    employees.forEach(emp=>{

        if(emp.department!==currentDepartment){

            currentDepartment=emp.department;

            attendanceList.innerHTML +=
            `<h3>${currentDepartment}</h3>`;

        }

        const icon =
            submitted.has(emp.id)
            ? "🟢"
            : "⚪";

        attendanceList.innerHTML += `
        <div class="employee-row">
            ${icon} ${emp.name}
        </div>
        `;

    });

}

document
.getElementById("reload")
.addEventListener("click",loadAttendanceStatus);

month.addEventListener("change",loadAttendanceStatus);

loadAttendanceStatus();
