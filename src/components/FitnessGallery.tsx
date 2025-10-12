import backImage from "@/assets/back.jpg";
import workingOut from "@/assets/working-out.jpg";
import workingOut2 from "@/assets/working-out2.jpg";

const FitnessGallery = () => {
  return (
    <section className="w-full">
      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
        {/* Image 1 - Back Training */}
        <div className="w-full aspect-[4/5] overflow-hidden">
          <img 
            src={backImage} 
            alt="Professional back training with battle ropes in modern gym"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Image 2 - Functional Training */}
        <div className="w-full aspect-[4/5] overflow-hidden">
          <img 
            src={workingOut} 
            alt="Functional training with weights in professional gym setting"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Image 3 - Personal Training */}
        <div className="w-full aspect-[4/5] overflow-hidden">
          <img 
            src={workingOut2} 
            alt="One-on-one personal training session with professional guidance"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
};

export default FitnessGallery;