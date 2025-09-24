import Navbar from "./components/Navbar"
import NewsContainer from "./components/NewsContainer"

const App = () => {
  return (
    <div className='bg-[#DDC3C3] min-h-screen'>
     <div className=" max-w-6xl   mx-auto ">
  <Navbar />
      <NewsContainer/>
     </div>
    
    </div>
  )
}

export default App