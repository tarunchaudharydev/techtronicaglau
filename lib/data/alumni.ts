export interface Alumni {
  id: number | string;
  name: string;
  session: string;          
  roleInSociety: string;   
  club?: string;            
  image: string;            
  linkedin: string;

  currentRole: string;      
  currentCompany?: string;  
  currentLocation?: string; 

  achievements?: string[];  
  message?: string;         
}
