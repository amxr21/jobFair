import Header from "../components/ApplicantPage/Header";
import QuickApplyForm from "../components/ApplicantPage/QuickApplyForm";

import { IdProvider } from "../context/IdContext";


const ApplicantPage = () => {
    return (
        <IdProvider>
            <div className="flex gap-x-24 py-8">
                <Header />
                <QuickApplyForm />
            </div>
        </IdProvider>

    )
}

export default ApplicantPage;