import { UserRepository } from "../../../modules/users/repositories";


export class AuthRepository {


    constructor(
        private userRepository = new UserRepository()
    ){}



    async findUserByEmail(email:string){

        return this.userRepository.findByEmail(email);

    }


}