import { NavBar, MainBanner, Form } from "./index";
// import "./style.css"

const ApplicationForm = () => {
  let a = localStorage.getItem("user")

  return (
    <div>
      {/* <NavBar /> */}
      {
      a
      ?
      JSON.parse(a)?.email &&
        <div className="text-left">You are now logged in as {"\t"}
          <span className="font-bold underline uppercase">
          {
            
            `${JSON.parse(a).email.split('@')[0]}`
          }
          </span>
        </div>
      :
      <>
        <div className="text-left">You are now logged in as {"\t"}
          <span className="font-bold underline uppercase">
          guest
          </span>
        </div>
      </>

      }

      <MainBanner/>
      <Form/>
    </div>
  )
}

export default ApplicationForm
