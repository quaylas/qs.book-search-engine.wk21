const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
const {decode} = require('jsonwebtoken');

const resolvers = {
    Query: { 
        me: async (parent, args, context ) => {
            if(context.user) {
                userEmail = context.user.email;
                console.log(userEmail, context.user);
                const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('savedBooks');

                return userData;
            }

            throw new AuthenticationError('Not logged in!');
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        
        login: async (parent, { email, password }) => {
            const user = await User.findOne({email})
            .select('-__v')
            .populate('savedBooks');
            
            if(!user) {
                throw new AuthenticationError('Incorrect credentials!');
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError('Incorrect credentials!');
            }

            const token = signToken(user);
            return { token, user };

        },

        saveBook: async (parent, args, context) => {
            if(context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: {savedBooks: args.input } },
                    { new: true }
                );

                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in!');
        }
    }
}
module.exports = resolvers;